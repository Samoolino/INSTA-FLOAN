import type {FlashLiquidity} from './opportunity-assurance'
import type {Quote} from './market'

export type OpportunityRoute = {
  key: string
  lender: string
  chainId: number
  tokenIn: string
  tokenOut: string
  venue: string
  quoteFresh: boolean
  liquidityUsd: number
}

export function buildOpportunityGraph(liquidity: FlashLiquidity[], quotes: Quote[], maxQuoteAgeMs = 15_000): OpportunityRoute[] {
  const now = Date.now()
  const enabled = liquidity.filter(x => x.enabled !== false && x.availableUsd > 0)
  const routes: OpportunityRoute[] = []
  const seen = new Set<string>()

  for (const q of quotes) {
    const source = enabled.find(x => x.chainId === q.chainId && x.token.toLowerCase() === q.tokenIn.toLowerCase())
    if (enabled.length > 0 && !source) continue
    const fresh = Number.isFinite(q.timestamp) && now - q.timestamp <= maxQuoteAgeMs
    const lender = source?.lender ?? 'configured-liquidity'
    const key = `${lender}:${q.chainId}:${q.tokenIn.toLowerCase()}:${q.tokenOut.toLowerCase()}:${q.venue}`
    if (seen.has(key)) continue
    seen.add(key)
    routes.push({
      key,
      lender,
      chainId: q.chainId,
      tokenIn: q.tokenIn,
      tokenOut: q.tokenOut,
      venue: q.venue,
      quoteFresh: fresh,
      liquidityUsd: source?.availableUsd ?? 0,
    })
  }
  return routes
}
