import {type Address, createPublicClient, defineChain, http} from 'viem'
import {mainnet, arbitrum, base, bsc, type Chain} from 'viem/chains'
import {type Quote} from './market'
import {quoteUniswapV2} from './uniswap-v2'

type LiveRoute = {
  venue?: string
  chainId: number
  chainName?: string
  nativeSymbol?: string
  rpcUrlEnv: string
  router: Address
  path: Address[]
  amountInRaw: string
  tokenInDecimals?: number
  tokenOutDecimals?: number
  tokenInUsd: number
  tokenOutUsd: number
  gasUsd?: number
  slippageUsd?: number
}

const knownChains: Record<number, Chain> = {1: mainnet, 42161: arbitrum, 8453: base, 56: bsc}

function routesFromEnv(): LiveRoute[] {
  const raw = process.env.LIVE_QUOTE_ROUTES
  if (!raw) return []
  let parsed: unknown
  try { parsed = JSON.parse(raw) } catch { throw new Error('INVALID_LIVE_QUOTE_ROUTES_JSON') }
  if (!Array.isArray(parsed)) throw new Error('LIVE_QUOTE_ROUTES_MUST_BE_ARRAY')
  return parsed as LiveRoute[]
}

function chainFor(route: LiveRoute): Chain | undefined {
  if (!Number.isInteger(route.chainId) || route.chainId <= 0) return undefined
  if (knownChains[route.chainId]) return knownChains[route.chainId]
  if (!route.chainName) return undefined
  return defineChain({
    id: route.chainId,
    name: route.chainName,
    nativeCurrency: {name: route.nativeSymbol || 'Native', symbol: route.nativeSymbol || 'NATIVE', decimals: 18},
    rpcUrls: {default: {http: []}},
  })
}

export function getConfiguredLiveVenues(): string[] {
  const venues = new Set<string>()
  for (const route of routesFromEnv()) {
    if (typeof route.venue === 'string' && route.venue.trim()) venues.add(route.venue.trim())
  }
  return [...venues].sort()
}

/** Return the EVM chain IDs represented by valid, explicitly configured routes. */
export function getConfiguredLiveChainIds(): number[] {
  return [...new Set(routesFromEnv().map(route => route.chainId).filter(id => Number.isInteger(id) && id > 0))].sort((a,b)=>a-b)
}

async function decimals(client: ReturnType<typeof createPublicClient>, token: Address, configured?: number) {
  if (configured !== undefined) return configured
  return Number(await client.readContract({
    address: token,
    abi: [{type:'function',name:'decimals',stateMutability:'view',inputs:[],outputs:[{type:'uint8'}]}],
    functionName:'decimals',
  }))
}

/**
 * Real on-chain quote adapter. It never fabricates prices: routes are explicitly
 * configured, getAmountsOut is read from the configured router, and USD values
 * are calculated only from operator-supplied token prices.
 *
 * Known networks use viem's canonical chain definitions. Additional EVM networks
 * can be added without a source-code change by supplying chainId + chainName and
 * a validated RPC environment variable in LIVE_QUOTE_ROUTES.
 */
export async function getLiveQuotes(): Promise<Quote[]> {
  const routes = routesFromEnv()
  const quotes: Quote[] = []

  for (const route of routes) {
    const chain = chainFor(route)
    if (!chain) continue
    if (!route.rpcUrlEnv || !route.router || !Array.isArray(route.path) || route.path.length < 2) continue
    if (!Number.isFinite(route.tokenInUsd) || route.tokenInUsd <= 0 || !Number.isFinite(route.tokenOutUsd) || route.tokenOutUsd <= 0) continue

    const rpcUrl = process.env[route.rpcUrlEnv]
    if (!rpcUrl) continue
    const client = createPublicClient({chain, transport:http(rpcUrl)})
    const blockNumber = await client.getBlockNumber()
    const inDecimals = await decimals(client, route.path[0], route.tokenInDecimals)
    const outDecimals = await decimals(client, route.path[route.path.length - 1], route.tokenOutDecimals)
    const amountIn = BigInt(route.amountInRaw)
    const result = await quoteUniswapV2({rpcUrl, chain, router:route.router, path:route.path, amountIn, expectedBlockNumber:blockNumber})

    const amountInUnits = Number(amountIn) / 10 ** inDecimals
    const amountOutUnits = Number(result.amountOut) / 10 ** outDecimals
    if (!Number.isFinite(amountInUnits) || !Number.isFinite(amountOutUnits) || amountInUnits <= 0 || amountOutUnits <= 0) continue

    quotes.push({
      venue: route.venue || `UniswapV2:${route.chainId}`,
      chainId: route.chainId,
      tokenIn: route.path[0],
      tokenOut: route.path[route.path.length - 1],
      amountInUsd: amountInUnits * route.tokenInUsd,
      amountOutUsd: amountOutUnits * route.tokenOutUsd,
      gasUsd: Math.max(0, route.gasUsd ?? 0),
      slippageUsd: Math.max(0, route.slippageUsd ?? 0),
      timestamp: result.timestamp,
    })
  }

  return quotes
}
