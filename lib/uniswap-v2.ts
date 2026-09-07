import {type Hex, type Address, encodeFunctionData, parseAbi, createPublicClient, http} from 'viem'
import {mainnet, arbitrum, base, bsc, type Chain} from 'viem/chains'

export type V2QuoteConfig = {
  rpcUrl: string
  chain: Chain
  router: Address
  path: Address[]
  amountIn: bigint
}

export type V2Quote = {
  chainId: number
  router: Address
  path: Address[]
  amountIn: bigint
  amountOut: bigint
  blockNumber: bigint
  timestamp: number
}

const abi = parseAbi(['function getAmountsOut(uint256 amountIn,address[] memory path) view returns (uint256[] memory amounts)'])

export async function quoteUniswapV2(config: V2QuoteConfig): Promise<V2Quote> {
  if (!config.rpcUrl) throw new Error('RPC_NOT_CONFIGURED')
  if (config.path.length < 2) throw new Error('INVALID_SWAP_PATH')
  if (config.amountIn <= 0n) throw new Error('INVALID_AMOUNT_IN')

  const client = createPublicClient({chain: config.chain, transport: http(config.rpcUrl)})
  const blockNumber = await client.getBlockNumber()
  const amounts = await client.readContract({address: config.router, abi, functionName: 'getAmountsOut', args: [config.amountIn, config.path]})
  const amountOut = amounts[amounts.length - 1]
  if (!amountOut || amountOut <= 0n) throw new Error('INVALID_AMOUNT_OUT')

  return {chainId: config.chain.id, router: config.router, path: config.path, amountIn: config.amountIn, amountOut, blockNumber, timestamp: Date.now()}
}

export const supportedChains = {mainnet, arbitrum, base, bsc}
