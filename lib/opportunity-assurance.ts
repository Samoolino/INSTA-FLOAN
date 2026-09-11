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
  | 'VENUE_COVERAGE_INCOMPLETE'

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
  configuredVenueCount: number
  activeVenueCount: number
  venueCoverageRatio: number
  chainCount: number
  executableOpportunityCount: number
  expandable: boolean
  nextActions: string[]
  message: string
}

/**
 * Opportunity assurance is a coverage/readiness guarantee, not a promise of profit.
 * The MCP control plane prioritizes availability: every configured venue must be
 * actively producing fresh, valid quotes before the venue set is considered ready.
 * An executable opportunity additionally requires a positive-net safe path.
 */
export function assessOpportunityCoverage(
  quotes: Quote[],
  liquidity: FlashLiquidity[],
  opportunities: Opportunity[],
  configuredVenues: string[] = [],
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
  const executableOpportunityCount = profitablePaths.length

  const liquidityKeys = new Set(enabledLiquidity.map(x => `${x.chainId}:${x.token.toLowerCase()}`))
  const coveredKeys = new Set(
    freshQuotes
      .map(q => `${q.chainId}:${q.tokenIn.toLowerCase()}`)
      .filter(k => liquidityKeys.size === 0 || liquidityKeys.has(k)),
  )
  const coverageRatio = liquidityKeys.size === 0 ? 0 : coveredKeys.size / liquidityKeys.size
  const quoteFreshnessRatio = validQuotes.length === 0 ? 0 : freshQuotes.length / validQuotes.length
  const configuredVenueSet = new Set(configuredVenues.filter(Boolean))
  const activeVenueSet = new Set(freshQuotes.map(q => q.venue).filter(Boolean))
  const activeVenueCount = [...configuredVenueSet].filter(v => activeVenueSet.has(v)).length
  const venueCoverageRatio = configuredVenueSet.size === 0 ? 0 : activeVenueCount / configuredVenueSet.size
  const venueCount = activeVenueSet.size
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
    configuredVenueCount: configuredVenueSet.size,
    activeVenueCount,
    venueCoverageRatio,
    chainCount,
    executableOpportunityCount,
    expandable: true,
  }

  if (quotes.length === 0 || configuredVenueSet.size === 0) {
    return {
      ...base,
      status: 'NO_LIVE_ROUTES',
      grade: 'F',
      nextActions: ['Configure every intended venue as a verified on-chain quote route', 'Attach each venue route to supported flash-liquidity assets', 'Do not label a venue executable until it returns fresh quotes'],
      message: 'No complete live venue set is configured. The availability engine will not fabricate venues or opportunities.',
    }
  }

  if (validQuotes.length === 0 || freshQuotes.length === 0) {
    return {
      ...base,
      status: 'NO_FRESH_QUOTES',
      grade: 'D',
      nextActions: ['Refresh or rotate stale venue routes', 'Verify RPC availability and router/token configuration', 'Keep execution blocked until every configured venue is freshly observed'],
      message: 'Configured venues exist, but there are no fresh valid quotes. Execution remains blocked until freshness is restored.',
    }
  }

  if (venueCoverageRatio < 1) {
    return {
      ...base,
      status: 'VENUE_COVERAGE_INCOMPLETE',
      grade: venueCoverageRatio >= 0.75 ? 'B' : 'C',
      nextActions: ['Activate missing configured venues', 'Rotate stale or unavailable venue routes', 'Re-scan all venues before defining an opportunity as executable'],
      message: `Only ${(venueCoverageRatio * 100).toFixed(0)}% of configured venues are actively returning fresh quotes. Opportunity availability is not yet complete.`,
    }
  }

  if (liquidityKeys.size > 0 && coverageRatio < 1) {
    return {
      ...base,
      status: 'PARTIAL_COVERAGE',
      grade: coverageRatio >= 0.75 ? 'B' : 'C',
      nextActions: ['Expand routes for uncovered liquidity assets', 'Rotate toward fresh venues/chains', 'Re-scan before any execution decision'],
      message: `All configured venues are active, but only ${(coverageRatio * 100).toFixed(0)}% of enabled liquidity assets have fresh route coverage.`,
    }
  }

  if (executableOpportunityCount === 0) {
    return {
      ...base,
      status: 'NO_PROFITABLE_PATHS',
      grade: 'B',
      nextActions: ['Continue continuous scanning across every active venue', 'Rotate routes as spreads, gas and liquidity change', 'Do not force execution to reach the target'],
      message: 'All configured venues are actively covered, but no positive-net opportunity currently satisfies the executable safety gate.',
    }
  }

  return {
    ...base,
    status: 'COVERAGE_READY',
    grade: quoteFreshnessRatio >= 0.9 && coverageRatio >= 0.9 ? 'A' : 'B',
    nextActions: ['Continue continuous all-venue scanning', 'Revalidate quote freshness immediately before simulation', 'Apply controlled-fork, repayment, wallet, risk and execution gates before authorization'],
    message: 'Every configured venue is actively returning fresh coverage and at least one positive-net path is currently executable under the market safety gate.',
  }
}
