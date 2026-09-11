import {NextResponse} from 'next/server'
import {discoverOpportunities, type Quote} from '../../../lib/market'
import {getConfiguredLiveVenues, getLiveQuotes} from '../../../lib/live-quote-adapter'
import {runtimeConfig} from '../../../lib/config'
import {getFlashLiquidity} from '../../../lib/flash-liquidity'
import {assessOpportunityCoverage} from '../../../lib/opportunity-assurance'
import {buildOpportunityGraph} from '../../../lib/opportunity-graph'
import {evaluateCandidates} from '../../../lib/target-engine'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const {searchParams} = new URL(request.url)
  const requestedTarget = Number(searchParams.get('target'))
  const target = Number.isFinite(requestedTarget) && requestedTarget > 0
    ? requestedTarget
    : runtimeConfig.targetProfitUsd

  let quotes: Quote[] = []
  let adapterError: string | undefined
  try { quotes = await getLiveQuotes() }
  catch (error) { adapterError = error instanceof Error ? error.message : 'LIVE_QUOTE_ADAPTER_ERROR' }

  let configuredVenues: string[] = []
  let venueConfigError: string | undefined
  try { configuredVenues = getConfiguredLiveVenues() }
  catch (error) { venueConfigError = error instanceof Error ? error.message : 'LIVE_VENUE_CONFIGURATION_ERROR' }

  let liquidity = [] as ReturnType<typeof getFlashLiquidity>
  let liquidityError: string | undefined
  try { liquidity = getFlashLiquidity() }
  catch (error) { liquidityError = error instanceof Error ? error.message : 'FLASH_LIQUIDITY_CONFIGURATION_ERROR' }

  const opportunities = discoverOpportunities(quotes)
  const graph = buildOpportunityGraph(liquidity, quotes)
  const assurance = assessOpportunityCoverage(quotes, liquidity, opportunities, configuredVenues)
  const result = evaluateCandidates(opportunities, {
    targetProfit: target,
    minNetProfit: runtimeConfig.minNetProfitUsd,
    safetyReserve: runtimeConfig.safetyReserveUsd,
    maxPaths: runtimeConfig.maxPathsPerCycle,
    maxCycles: runtimeConfig.maxCycles,
  })

  const configurationError = adapterError || venueConfigError || liquidityError
  const operationalState = configurationError
    ? 'CONFIGURATION_BLOCKED'
    : assurance.status === 'NO_LIVE_ROUTES'
      ? 'WAITING_FOR_ROUTE_CONFIGURATION'
      : assurance.status === 'NO_FRESH_QUOTES'
        ? 'WAITING_FOR_FRESH_QUOTES'
        : assurance.status === 'VENUE_COVERAGE_INCOMPLETE'
          ? 'WAITING_FOR_VENUE_COVERAGE'
          : assurance.status === 'PARTIAL_COVERAGE'
            ? 'WAITING_FOR_LIQUIDITY_COVERAGE'
            : result.targetReached
              ? 'TARGET_REACHED'
              : result.eligibleCount > 0
                ? 'OPPORTUNITIES_AVAILABLE'
                : 'WAITING_FOR_OPPORTUNITY'

  const nextProcedure = operationalState === 'CONFIGURATION_BLOCKED'
    ? 'Restore RPC, venue and liquidity configuration; then re-run availability assurance.'
    : operationalState === 'WAITING_FOR_ROUTE_CONFIGURATION'
      ? 'Configure and verify every intended venue route.'
      : operationalState === 'WAITING_FOR_FRESH_QUOTES'
        ? 'Refresh all configured venue quotes and reject stale observations.'
        : operationalState === 'WAITING_FOR_VENUE_COVERAGE'
          ? 'Activate or rotate missing venues and require fresh observations from the complete configured set.'
          : operationalState === 'WAITING_FOR_LIQUIDITY_COVERAGE'
            ? 'Expand or rotate routes until enabled flash-liquidity assets have fresh coverage.'
            : operationalState === 'TARGET_REACHED'
              ? 'Stop new execution and reconcile realized profit against the target.'
              : operationalState === 'OPPORTUNITIES_AVAILABLE'
                ? 'Revalidate route freshness, simulate atomic repayment, attest controlled-fork state, then apply wallet/risk/slippage/gas/execution gates.'
                : 'Continue continuous discovery and route rotation; do not lower safety/profitability gates or force a trade.'

  return NextResponse.json({
    operationalState,
    nextProcedure,
    executionAuthorization: 'BLOCKED',
    liveExecution: runtimeConfig.liveExecution,
    assurance,
    venueAvailability: {
      configuredVenues,
      configuredVenueCount: assurance.configuredVenueCount,
      activeVenueCount: assurance.activeVenueCount,
      venueCoverageRatio: assurance.venueCoverageRatio,
      allConfiguredVenuesActive: assurance.configuredVenueCount > 0 && assurance.activeVenueCount === assurance.configuredVenueCount,
      executableOpportunityCount: assurance.executableOpportunityCount,
    },
    targetAttainment: {
      targetProfit: result.targetProfit,
      accumulatedProfit: result.accumulatedProfit,
      remaining: result.remaining,
      targetReached: result.targetReached,
      eligibleCount: result.eligibleCount,
      selectedCount: result.selected.length,
    },
    routeGraph: {
      routeCount: graph.length,
      freshRouteCount: graph.filter(route => route.quoteFresh).length,
      liquidityCoveredRouteCount: graph.filter(route => route.liquidityUsd > 0).length,
    },
    quoteCount: quotes.length,
    opportunityCount: opportunities.length,
    errors: {adapterError, venueConfigError, liquidityError},
    message: configurationError
      ? 'Configuration is incomplete; no transaction is submitted.'
      : operationalState === 'WAITING_FOR_OPPORTUNITY'
        ? 'No executable opportunity is currently available. This is a controlled waiting state; discovery, refresh, pricing and safety evaluation continue.'
        : operationalState === 'OPPORTUNITIES_AVAILABLE'
          ? 'Positive-net opportunities are available, but this endpoint never authorizes or submits transactions. Every production execution gate must pass first.'
          : operationalState === 'TARGET_REACHED'
            ? 'Target attainment is reached by the selection engine; stop new execution and reconcile.'
            : 'Availability is being evaluated continuously under the fail-closed opportunity assurance procedure.',
  })
}
