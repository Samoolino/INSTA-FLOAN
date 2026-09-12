import {NextResponse} from 'next/server'
import {getConfiguredLiveVenues} from '@/lib/live-quote-adapter'
import {getFlashLiquidity} from '@/lib/flash-liquidity'
import {getExecutionTruth} from '@/lib/execution-truth'
import {runtimeConfig} from '@/lib/config'

export const dynamic = 'force-dynamic'

export async function GET() {
  let venues: string[] = []
  let liquidity: ReturnType<typeof getFlashLiquidity> = []
  const errors: string[] = []

  try { venues = getConfiguredLiveVenues() } catch (e) { errors.push(e instanceof Error ? e.message : 'LIVE_VENUE_CONFIGURATION_ERROR') }
  try { liquidity = getFlashLiquidity() } catch (e) { errors.push(e instanceof Error ? e.message : 'FLASH_LIQUIDITY_CONFIGURATION_ERROR') }

  const truth = getExecutionTruth(false)
  const venueCount = venues.length
  const liquidityCount = liquidity.filter(x => x.enabled !== false && Number.isFinite(x.availableUsd) && x.availableUsd > 0).length

  const actions = venueCount === 0
    ? [
        {id: 'CONFIGURE_VENUES', executable: true, mode: 'configuration', procedure: 'Add independently verified routes to LIVE_QUOTE_ROUTES; do not use placeholder addresses.'},
        {id: 'ATTACH_FLASH_LIQUIDITY', executable: true, mode: 'configuration', procedure: 'Attach each intended token/chain route to a verified flash-liquidity record.'},
        {id: 'REFRESH_QUOTES', executable: true, mode: 'read-only', procedure: 'Re-run the live quote adapter after routes and RPCs are configured.'},
      ]
    : [
        {id: 'REFRESH_QUOTES', executable: true, mode: 'read-only', procedure: 'Refresh all configured on-chain quotes and reject stale observations.'},
        {id: 'ROTATE_ROUTES', executable: true, mode: 'read-only', procedure: 'Identify stale/unavailable venue routes and expand coverage using verified configurations.'},
        {id: 'START_TARGET', executable: true, mode: 'read-only', procedure: `Start continuous target discovery at $${runtimeConfig.targetProfitUsd}; never force a trade when no safe positive-net path exists.`},
      ]

  actions.push({
    id: 'ARM_EXECUTION',
    executable: false,
    mode: 'authorization-gated',
    procedure: truth.state === 'READY_FOR_AUTHORIZATION'
      ? 'Explicit execution authorization is the remaining gate.'
      : 'Evaluate controlled-fork attestation, wallet authorization, risk, profitability, slippage/gas, execution path and kill switch before authorization.',
  })

  actions.push({id: 'STOP', executable: true, mode: 'safety', procedure: 'Operator kill-switch action; execution must remain stopped whenever a mandatory gate fails.'})

  return NextResponse.json({
    ok: true,
    status: venueCount === 0 ? 'NO_LIVE_ROUTES' : liquidityCount === 0 ? 'NO_LIQUIDITY_COVERAGE' : 'CONFIGURED',
    venueCount,
    liquidityCount,
    executionTruth: truth,
    actions,
    errors,
    policy: {
      liveExecution: truth.liveExecution,
      automationEnabled: truth.automationEnabled,
      autonomousSubmission: truth.autonomousSubmission,
      inclusionIncentiveEnabled: truth.inclusionIncentiveEnabled,
      controlledForkRequired: true,
      explicitAuthorizationRequired: truth.explicitAuthorizationRequired,
    },
  })
}
