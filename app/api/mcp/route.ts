import {createMcpHandler} from 'mcp-handler'
import {z} from 'zod'
import {runtimeConfig} from '../../../lib/config'
import {getInstadappCastEngineStatus} from '../../../lib/instadapp-adapter'
import {getFlashLiquidity} from '../../../lib/flash-liquidity'
import {buildOpportunityGraph} from '../../../lib/opportunity-graph'
import {assessOpportunityCoverage} from '../../../lib/opportunity-assurance'
import {discoverOpportunities} from '../../../lib/market'
import {getConfiguredLiveVenues, getLiveQuotes} from '../../../lib/live-quote-adapter'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const unauthorized = () => new Response('MCP authorization required', {status: 401})

function authorized(request: Request) {
  const expected = process.env.MCP_ACCESS_TOKEN?.trim()
  if (!expected) return false
  const actual = request.headers.get('authorization')
  return actual === `Bearer ${expected}`
}

async function marketSnapshot() {
  const quotes = await getLiveQuotes()
  const liquidity = getFlashLiquidity()
  const configuredVenues = getConfiguredLiveVenues()
  const opportunities = discoverOpportunities(quotes)
  const assurance = assessOpportunityCoverage(quotes, liquidity, opportunities, configuredVenues)
  const graph = buildOpportunityGraph(liquidity, quotes)
  const executableOpportunities = opportunities.filter(o => o.safe && o.net >= runtimeConfig.minNetProfitUsd)

  return {quotes, liquidity, configuredVenues, opportunities, executableOpportunities, assurance, graph}
}

const handler = createMcpHandler((server) => {
  server.registerTool(
    'get_runtime_status',
    {
      title: 'Runtime Status',
      description: 'Read the current INSTA-FLOAN runtime mode and execution authorization state. Never enables execution.',
      inputSchema: z.object({}),
    },
    async () => ({
      content: [{type: 'text', text: JSON.stringify({
        service: 'INSTA-FLOAN',
        liveExecution: runtimeConfig.liveExecution,
        mode: runtimeConfig.liveExecution ? 'LIVE_BLOCKED_PENDING_VALIDATION' : 'SIMULATION_ONLY',
        executionAuthorization: 'BLOCKED',
        targetProfitUsd: runtimeConfig.targetProfitUsd,
        minNetProfitUsd: runtimeConfig.minNetProfitUsd,
        safetyReserveUsd: runtimeConfig.safetyReserveUsd,
        timestamp: new Date().toISOString(),
      }, null, 2)}],
    }),
  )

  server.registerTool(
    'get_cast_engine_status',
    {
      title: 'Instadapp Cast Engine',
      description: 'Inspect the installed direct-ABI Instadapp Cast engine and its production safety boundary.',
      inputSchema: z.object({}),
    },
    async () => ({content: [{type: 'text', text: JSON.stringify(getInstadappCastEngineStatus(), null, 2)}]}),
  )

  server.registerTool(
    'get_liquidity_status',
    {
      title: 'Flash Liquidity Status',
      description: 'Read configured flash-liquidity sources and funded assets. No borrowing or transaction submission occurs.',
      inputSchema: z.object({}),
    },
    async () => {
      try {
        const liquidity = getFlashLiquidity()
        return {content: [{type: 'text', text: JSON.stringify({count: liquidity.length, liquidity}, null, 2)}]}
      } catch (error) {
        return {content: [{type: 'text', text: JSON.stringify({error: error instanceof Error ? error.message : 'LIQUIDITY_CONFIGURATION_ERROR'}, null, 2)}], isError: true}
      }
    },
  )

  server.registerTool(
    'get_venue_availability',
    {
      title: 'All-Venue Availability',
      description: 'Verify that every configured venue is actively returning fresh quotes. A configured venue is not considered available until it is observed live.',
      inputSchema: z.object({}),
    },
    async () => {
      try {
        const snapshot = await marketSnapshot()
        const active = new Set(snapshot.quotes.filter(q => Number.isFinite(q.timestamp) && Date.now() - q.timestamp <= 15_000).map(q => q.venue))
        return {content: [{type: 'text', text: JSON.stringify({
          configuredVenues: snapshot.configuredVenues,
          activeVenues: snapshot.configuredVenues.filter(v => active.has(v)),
          inactiveVenues: snapshot.configuredVenues.filter(v => !active.has(v)),
          configuredVenueCount: snapshot.assurance.configuredVenueCount,
          activeVenueCount: snapshot.assurance.activeVenueCount,
          venueCoverageRatio: snapshot.assurance.venueCoverageRatio,
          allConfiguredVenuesActive: snapshot.assurance.configuredVenueCount > 0 && snapshot.assurance.activeVenueCount === snapshot.assurance.configuredVenueCount,
          status: snapshot.assurance.status,
        }, null, 2)}]}
      } catch (error) {
        return {content: [{type: 'text', text: JSON.stringify({error: error instanceof Error ? error.message : 'VENUE_AVAILABILITY_ERROR'}, null, 2)}], isError: true}
      }
    },
  )

  server.registerTool(
    'get_opportunity_assurance',
    {
      title: 'Opportunity Assurance',
      description: 'Evaluate all-venue engagement, quote freshness, flash-liquidity coverage and positive-net executable paths. This is a readiness signal, not a profit guarantee.',
      inputSchema: z.object({}),
    },
    async () => {
      try {
        const snapshot = await marketSnapshot()
        return {content: [{type: 'text', text: JSON.stringify(snapshot.assurance, null, 2)}]}
      } catch (error) {
        return {content: [{type: 'text', text: JSON.stringify({status: 'ERROR', error: error instanceof Error ? error.message : 'OPPORTUNITY_ASSURANCE_ERROR'}, null, 2)}], isError: true}
      }
    },
  )

  server.registerTool(
    'get_opportunity_graph',
    {
      title: 'Opportunity Graph',
      description: 'Read the current flash-liquidity to token/venue route graph using fresh on-chain quotes. No execution is performed.',
      inputSchema: z.object({}),
    },
    async () => {
      try {
        const snapshot = await marketSnapshot()
        return {content: [{type: 'text', text: JSON.stringify({routeCount: snapshot.graph.length, routes: snapshot.graph}, null, 2)}]}
      } catch (error) {
        return {content: [{type: 'text', text: JSON.stringify({error: error instanceof Error ? error.message : 'OPPORTUNITY_GRAPH_ERROR'}, null, 2)}], isError: true}
      }
    },
  )

  server.registerTool(
    'get_profitable_opportunities',
    {
      title: 'Profitable Opportunities',
      description: 'Read opportunities that currently clear the configured positive-net and safety gates. Never forces a trade to meet a target.',
      inputSchema: z.object({}),
    },
    async () => {
      try {
        const snapshot = await marketSnapshot()
        return {content: [{type: 'text', text: JSON.stringify({count: snapshot.executableOpportunities.length, opportunities: snapshot.executableOpportunities}, null, 2)}]}
      } catch (error) {
        return {content: [{type: 'text', text: JSON.stringify({error: error instanceof Error ? error.message : 'PROFITABILITY_SCAN_ERROR'}, null, 2)}], isError: true}
      }
    },
  )

  server.registerTool(
    'get_production_gates',
    {
      title: 'Production Execution Gates',
      description: 'Read production execution gate status. This tool is read-only and cannot authorize, disable the kill switch, sign, or submit transactions.',
      inputSchema: z.object({}),
    },
    async () => ({content: [{type: 'text', text: JSON.stringify({
      controlledForkValidated: runtimeConfig.controlledForkValidated,
      controlledForkValidationId: Boolean(runtimeConfig.controlledForkValidationId),
      atomicRepaymentValidated: runtimeConfig.atomicRepaymentValidated,
      walletAuthorized: runtimeConfig.walletAuthorized,
      riskLimitsValidated: runtimeConfig.riskLimitsValidated,
      profitabilityValidated: runtimeConfig.profitabilityValidated,
      slippageGasValidated: runtimeConfig.slippageGasValidated,
      executionPathEnabled: runtimeConfig.executionPathEnabled,
      killSwitchEnabled: runtimeConfig.killSwitchEnabled,
      liveExecution: runtimeConfig.liveExecution,
      executionAuthorization: 'BLOCKED',
    }, null, 2)}]}),
  )
})

async function securedHandler(request: Request) {
  if (!authorized(request)) return new Response('MCP authorization required', {status: 401})
  return handler(request)
}

export const GET = securedHandler
export const POST = securedHandler
