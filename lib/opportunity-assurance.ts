import type {Quote, Opportunity} from './market'

export type FlashLiquidity = {
  lender: string
  chainId: number
  token: string
  availableUsd: number
  enabled?: boolean
}

export type OpportunityAssurance = {
  status: 'COVERAGE_READY' | 'NO_LIVE_ROUTES' | 'NO_FRESH_QUOTES' | 'NO_PROFITABLE_PATHS'
  flashLiquiditySources: number
  fundedAssets: number
  configuredQuoteRoutes: number
  freshQuotes: number
  profitablePaths: number
  coverageRatio: number
  expandable: boolean
  message: string
}

/**
 * Opportunity assurance is a coverage/readiness guarantee, not a promise of profit.
 * The engine should continuously search every configured flash-liquidity asset against
 * every configured quote route and adapt routing when a venue/path becomes stale.
 */
export function assessOpportunityCoverage(
  quotes: Quote[],
  liquidity: FlashLiquidity[],
  opportunities: Opportunity[],
  maxQuoteAgeMs = 15_000,
): OpportunityAssurance {
  const enabledLiquidity = liquidity.filter(x => x.enabled !== false && Number.isFinite(x.availableUsd) && x.availableUsd > 0)
  const freshQuotes = quotes.filter(q => Number.isFinite(q.timestamp) && Date.now() - q.timestamp <= maxQuoteAgeMs)
  const profitablePaths = opportunities.filter(o => o.safe && o.net > 0)

  const liquidityKeys = new Set(enabledLiquidity.map(x => `${x.chainId}:${x.token.toLowerCase()}`))
  const coveredKeys = new Set(
    freshQuotes.map(q => `${q.chainId}:${q.tokenIn.toLowerCase()}`).filter(k => liquidityKeys.size === 0 || liquidityKeys.has(k)),
  )
  const coverageRatio = liquidityKeys.size === 0 ? 0 : coveredKeys.size / liquidityKeys.size

  if (quotes.length === 0) {
    return {
      status: 'NO_LIVE_ROUTES',
      flashLiquiditySources: enabledLiquidity.length,
      fundedAssets: liquidityKeys.size,
      configuredQuoteRoutes: 0,
      freshQuotes: 0,
      profitablePaths: 0,
      coverageRatio,
      expandable: true,
      message: 'No live quote routes are configured. Add verified routes; the system will not fabricate opportunities.',
    }
  }

  if (freshQuotes.length === 0) {
    return {
      status: 'NO_FRESH_QUOTES',
      flashLiquiditySources: enabledLiquidity.length,
      fundedAssets: liquidityKeys.size,
      configuredQuoteRoutes: quotes.length,
      freshQuotes: 0,
      profitablePaths: 0,
      coverageRatio,
      expandable: true,
      message: 'Configured routes exist, but no fresh quotes are available. Rotate or expand routes before execution.',
    }
  }

  if (profitablePaths.length === 0) {
    return {
      status: 'NO_PROFITABLE_PATHS',
      flashLiquiditySources: enabledLiquidity.length,
      fundedAssets: liquidityKeys.size,
      configuredQuoteRoutes: quotes.length,
      freshQuotes: freshQuotes.length,
      profitablePaths: 0,
      coverageRatio,
      expandable: true,
      message: 'Market coverage is live but no positive-net path currently clears the profitability gate.',
    }
  }

  return {
    status: 'COVERAGE_READY',
    flashLiquiditySources: enabledLiquidity.length,
    fundedAssets: liquidityKeys.size,
    configuredQuoteRoutes: quotes.length,
    freshQuotes: freshQuotes.length,
    profitablePaths: profitablePaths.length,
    coverageRatio,
    expandable: true,
    message: 'At least one fresh positive-net route is currently covered; continue scanning and rotate routes as liquidity/prices change.',
  }
}
