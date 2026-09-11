import {NextResponse} from 'next/server'
import {evaluateCandidates} from '../../../lib/target-engine'
import {discoverOpportunities, type Quote} from '../../../lib/market'
import {getConfiguredLiveVenues, getLiveQuotes} from '../../../lib/live-quote-adapter'
import {runtimeConfig} from '../../../lib/config'
import {getFlashLiquidity} from '../../../lib/flash-liquidity'
import {assessOpportunityCoverage} from '../../../lib/opportunity-assurance'
import {buildOpportunityGraph} from '../../../lib/opportunity-graph'

export const dynamic='force-dynamic'

export async function GET(request:Request){
 const {searchParams}=new URL(request.url)
 const requestedTarget=Number(searchParams.get('target'))
 const target=Number.isFinite(requestedTarget)&&requestedTarget>0 ? requestedTarget : runtimeConfig.targetProfitUsd

 let quotes: Quote[]=[]
 let adapterError: string | undefined
 try { quotes=await getLiveQuotes() }
 catch (error) { adapterError=error instanceof Error ? error.message : 'LIVE_QUOTE_ADAPTER_ERROR' }

 let configuredVenues: string[]=[]
 let venueConfigError: string | undefined
 try { configuredVenues=getConfiguredLiveVenues() }
 catch (error) { venueConfigError=error instanceof Error ? error.message : 'LIVE_VENUE_CONFIGURATION_ERROR' }

 let liquidity = [] as ReturnType<typeof getFlashLiquidity>
 let liquidityError: string | undefined
 try { liquidity=getFlashLiquidity() }
 catch (error) { liquidityError=error instanceof Error ? error.message : 'FLASH_LIQUIDITY_CONFIGURATION_ERROR' }

 const opportunities=discoverOpportunities(quotes)
 const graph=buildOpportunityGraph(liquidity,quotes)
 const assurance=assessOpportunityCoverage(quotes,liquidity,opportunities,configuredVenues)
 const candidates=opportunities.map(o=>({...o}))
 const result=evaluateCandidates(candidates,{targetProfit:target,minNetProfit:runtimeConfig.minNetProfitUsd,safetyReserve:runtimeConfig.safetyReserveUsd,maxPaths:runtimeConfig.maxPathsPerCycle,maxCycles:runtimeConfig.maxCycles})
 const configurationError=adapterError||venueConfigError||liquidityError

 return NextResponse.json({
   status:configurationError?'live-readiness-error':'live-quotes',
   liveExecution:runtimeConfig.liveExecution,
   quoteCount:quotes.length,
   opportunityCount:opportunities.length,
   assurance,
   venueAvailability:{
     configuredVenues,
     configuredVenueCount:assurance.configuredVenueCount,
     activeVenueCount:assurance.activeVenueCount,
     venueCoverageRatio:assurance.venueCoverageRatio,
     allConfiguredVenuesActive:assurance.configuredVenueCount>0 && assurance.activeVenueCount===assurance.configuredVenueCount,
     executableOpportunityCount:assurance.executableOpportunityCount,
   },
   routeGraph:{
     routeCount:graph.length,
     freshRouteCount:graph.filter(r=>r.quoteFresh).length,
     liquidityCoveredRouteCount:graph.filter(r=>r.liquidityUsd>0).length,
     routes:graph,
   },
   ...result,
   adapterError,
   venueConfigError,
   liquidityError,
   message:configurationError
     ? 'Live market, venue or liquidity configuration is incomplete; no transaction is submitted.'
     : assurance.status==='VENUE_COVERAGE_INCOMPLETE'
       ? 'Venue availability is incomplete. The MCP control plane continues discovery/rotation and does not define partial coverage as executable.'
       : assurance.status==='NO_PROFITABLE_PATHS'
         ? 'All configured venues are active, but no positive-net executable opportunity currently clears the profitability gate.'
         : assurance.status==='PARTIAL_COVERAGE'
           ? 'All configured venues are active, but liquidity coverage is partial. Expand or rotate routes before execution.'
           : assurance.status==='NO_FRESH_QUOTES'
             ? 'Routes are configured but quote freshness is insufficient. Refresh before execution.'
             : 'All configured venues are actively covered. A route is executable only after the complete safety and production gates pass; scan itself never submits a transaction.',
 })
}
