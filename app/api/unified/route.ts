import { NextResponse } from 'next/server'
import { getExecutionTruth } from '../../../lib/execution-truth'
import { runtimeConfig } from '../../../lib/config'
import { getFlashLiquidity } from '../../../lib/flash-liquidity'
import { assessOpportunityCoverage } from '../../../lib/opportunity-assurance'
import { buildOpportunityGraph } from '../../../lib/opportunity-graph'
import { discoverOpportunities, type Quote } from '../../../lib/market'
import { getConfiguredLiveVenues, getLiveQuotes } from '../../../lib/live-quote-adapter'
import { evaluateCandidates } from '../../../lib/target-engine'
import { getHummingbotPoolPrices, getHummingbotTickers, listHummingbotConnectors, hummingbotConfigured } from '../../../lib/hummingbot-api'

export const dynamic = 'force-dynamic'

function countHummingbotItems(value: unknown) {
  if (Array.isArray(value)) return value.length
  if (value && typeof value === 'object') return Object.keys(value as Record<string, unknown>).length
  return 0
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const requestedTarget = Number(searchParams.get('target'))
  const target = Number.isFinite(requestedTarget) && requestedTarget > 0 ? requestedTarget : runtimeConfig.targetProfitUsd
  const walletAddress = request.headers.get('x-wallet-address') || searchParams.get('wallet') || undefined

  let quotes: Quote[] = []
  let adapterError: string | undefined
  try { quotes = await getLiveQuotes() } catch (error) { adapterError = error instanceof Error ? error.message : 'LIVE_QUOTE_ADAPTER_ERROR' }

  let configuredVenues: string[] = []
  let venueConfigError: string | undefined
  try { configuredVenues = getConfiguredLiveVenues() } catch (error) { venueConfigError = error instanceof Error ? error.message : 'LIVE_VENUE_CONFIGURATION_ERROR' }

  let liquidity: ReturnType<typeof getFlashLiquidity> = []
  let liquidityError: string | undefined
  try { liquidity = getFlashLiquidity() } catch (error) { liquidityError = error instanceof Error ? error.message : 'FLASH_LIQUIDITY_CONFIGURATION_ERROR' }

  const opportunities = discoverOpportunities(quotes)
  const graph = buildOpportunityGraph(liquidity, quotes)
  const assurance = assessOpportunityCoverage(quotes, liquidity, opportunities, configuredVenues)
  const result = evaluateCandidates(opportunities.map(o => ({ ...o })), {
    targetProfit: target,
    minNetProfit: runtimeConfig.minNetProfitUsd,
    safetyReserve: runtimeConfig.safetyReserveUsd,
    maxPaths: runtimeConfig.maxPathsPerCycle,
    maxCycles: runtimeConfig.maxCycles,
  })

  let hummingbot: Record<string, unknown> = {
    configured: hummingbotConfigured(),
    connectorCount: 0,
    tickerCount: 0,
    poolPriceCount: 0,
    status: hummingbotConfigured() ? 'DISCOVERY_PENDING' : 'NOT_CONFIGURED',
  }

  if (hummingbotConfigured()) {
    const [connectors, tickers, pools] = await Promise.allSettled([
      listHummingbotConnectors(),
      getHummingbotTickers(),
      getHummingbotPoolPrices(),
    ])
    const failures = [connectors, tickers, pools].filter(x => x.status === 'rejected')
    hummingbot = {
      configured: true,
      connectorCount: connectors.status === 'fulfilled' ? countHummingbotItems(connectors.value) : 0,
      tickerCount: tickers.status === 'fulfilled' ? countHummingbotItems(tickers.value) : 0,
      poolPriceCount: pools.status === 'fulfilled' ? countHummingbotItems(pools.value) : 0,
      status: failures.length ? 'PARTIAL_DISCOVERY' : 'DISCOVERY_READY',
      error: failures.length ? failures.map(x => x.status === 'rejected' ? String(x.reason?.message || x.reason) : '').join(' | ') : undefined,
    }
  }

  const execution = getExecutionTruth(false)
  const configurationError = adapterError || venueConfigError || liquidityError

  return NextResponse.json({
    status: configurationError ? 'live-readiness-error' : 'unified-control-plane',
    wallet: {
      address: walletAddress || null,
      identityScope: 'SHARED_CONTROL_PLANE_IDENTITY',
      custodyModel: 'INDEPENDENT_ENGINE_BALANCES',
      note: 'The same connected wallet address identifies both engines in the UI/control plane. CEX balances remain in Hummingbot exchange accounts; DApp/DEX balances remain on-chain. No automatic cross-engine transfer is implied.',
    },
    engines: {
      instadapp: {
        status: assurance.status,
        quoteCount: quotes.length,
        opportunityCount: opportunities.length,
        executableOpportunityCount: assurance.executableOpportunityCount,
        routeCount: graph.length,
        freshRouteCount: graph.filter(r => r.quoteFresh).length,
        liquidityCoveredRouteCount: graph.filter(r => r.liquidityUsd > 0).length,
        assuranceGrade: assurance.grade,
      },
      hummingbot,
    },
    execution,
    target: {
      requestedUsd: target,
      targetReached: Boolean(result.targetReached),
      nextAction: result.targetReached ? 'RECONCILE' : opportunities.length ? 'ROTATE_AND_RISK_GATE' : 'DISCOVER_MORE_ROUTES',
    },
    safety: {
      automationEnabled: execution.automationEnabled,
      autonomousSubmission: execution.autonomousSubmission,
      inclusionIncentives: execution.inclusionIncentiveEnabled,
      explicitAuthorizationRequired: execution.explicitAuthorizationRequired,
      controlledForkRequired: true,
      killSwitchEnabled: execution.killSwitchEnabled,
      liveExecution: execution.liveExecution,
    },
    errors: { adapterError, venueConfigError, liquidityError },
  })
}
