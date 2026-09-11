import type {Quote, Opportunity} from './market'

export type FlashLiquidity = {
  lender: string
  chainId: number
  token: string
  availableUsd: number
  enabled?: boolean
}

export type AssuranceState =
  | 'COVERAGE_READY'
  | 'PARTIAL_COVERAGE'
  | 'NO_LIVE_ROUTES'
  | 'NO_FRESH_QUOTES'
  | 'NO_PROFITABLE_PATHS'

export type OpportunityAssurance = {
  status: AssuranceState
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  flashLiquiditySources: number
  fundedAssets: number
  configuredQuoteRoutes: number
  freshQuotes: number
  profitablePaths: number
  coverageRatio: number
  quoteFreshnessRatio: number
  venueCount: number
  chainCount: number
  expandable: boolean
  nextActions: string[]
  message: string
}

/**
 * Opportunity assurance is a coverage/readiness guarantee, not a promise of profit.
 * It continuously measures whether configured flash liquidity is connected to fresh,
 * valid quote routes and whether any route currently clears the positive-net gate.
 */
export function assessOpportunityCoverage(
  quotes: Quote[],
  liquidity: FlashLiquidity[],
  opportunities: Opportunity[],
  maxQuoteAgeMs = 15_000,
): OpportunityAssurance {
  const enabledLiquidity = liquidity.filter(x => x.enabled !== false && Number.isFinite(x.availableUsd) && x.availableUsd > 0)
  const validQuotes = quotes.filter(q =>
    Number.isFinite(q.amountInUsd) && q.amountInUsd > 0 &&
    Number.isFinite(q.amountOutUsd) && q.amountOutUsd > 0 &&
    Number.isFinite(q.gasUsd) && q.gasUsd >= 0 &&
    Number.isFinite(q.slippageUsd) && q.slippageUsd >= 0 &&
    Number.isFinite(q.timestamp) && q.timestamp > 0 &&
    q.tokenIn.length > 0 && q.tokenOut.length > 0 && q.venue.length > 0,
  )
  const freshQuotes = validQuotes.filter(q => Date.now() - q.timestamp <= maxQuoteAgeMs)
  const profitablePaths = opportunities.filter(o => o.safe && o.net > 0)

  const liquidityKeys = new Set(enabledLiquidity.map(x => `${x.chainId}:${x.token.toLowerCase()}`))
  const coveredKeys = new Set(
    freshQuotes
      .map(q => `${q.chainId}:${q.tokenIn.toLowerCase()}`)
      .filter(k => liquidityKeys.size === 0 || liquidityKeys.has(k)),
  )
  const coverageRatio = liquidityKeys.size === 0 ? 0 : coveredKeys.size / liquidityKeys.size
  const quoteFreshnessRatio = validQuotes.length === 0 ? 0 : freshQuotes.length / validQuotes.length
  const venueCount = new Set(freshQuotes.map(q => q.venue)).size
  const chainCount = new Set(freshQuotes.map(q => q.chainId)).size

  const base = {
    flashLiquiditySources: enabledLiquidity.length,
    fundedAssets: liquidityKeys.size,
    configuredQuoteRoutes: quotes.length,
    freshQuotes: freshQuotes.length,
    profitablePaths: profitablePaths.length,
    coverageRatio,
    quoteFreshnessRatio,
    venueCount,
    chainCount,
    expandable: true,
  }

  if (quotes.length === 0) {
    return {
      ...base,
      status: 'NO_LIVE_ROUTES',
      grade: 'F',
      nextActions: ['Configure at least one verified on-chain quote route', 'Attach the route to a verified flash-liquidity asset'],
      message: 'No live quote routes are configured. The system is ready to expand, but it will not fabricate opportunities.',
    }
  }

  if (validQuotes.length === 0 || freshQuotes.length === 0) {
    return {
      ...base,
      status: 'NO_FRESH_QUOTES',
      grade: 'D',
      nextActions: ['Refresh or rotate stale routes', 'Verify RPC availability and router/token configuration'],
      message: 'Configured routes exist, but there are no fresh valid quotes. Execution remains blocked until freshness is restored.',
    }
  }

  if (liquidityKeys.size > 0 && coverageRatio < 1) {
    return {
      ...base,
      status: 'PARTIAL_COVERAGE',
      grade: coverageRatio >= 0.75 ? 'B' : 'C',
      nextActions: ['Expand routes for uncovered liquidity assets', 'Rotate toward fresh venues/chains', 'Re-scan before any execution decision'],
      message: `Market data is live, but only ${(coverageRatio * 100).toFixed(0)}% of enabled liquidity assets have fresh route coverage.`,
    }
  }

  if (profitablePaths.length === 0) {
    return {
      ...base,
      status: 'NO_PROFITABLE_PATHS',
      grade: 'B',
      nextActions: ['Continue scanning', 'Rotate venues/routes as spreads change', 'Do not force execution to reach the target'],
      message: 'Coverage is healthy, but no positive-net opportunity currently clears the profitability and safety gate.',
    }
  }

  return {
    ...base,
    status: 'COVERAGE_READY',
    grade: quoteFreshnessRatio >= 0.9 && coverageRatio >= 0.9 ? 'A' : 'B',
    nextActions: ['Continue continuous scanning', 'Revalidate quote freshness immediately before simulation', 'Apply the execution gates before authorization'],
    message: 'Fresh route coverage is available and at least one positive-net path currently clears the market safety gate.',
  }
}
