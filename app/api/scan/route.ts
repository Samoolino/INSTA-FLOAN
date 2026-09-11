import {NextResponse} from 'next/server'
import {evaluateCandidates} from '../../../lib/target-engine'
import {discoverOpportunities, type Quote} from '../../../lib/market'
import {getLiveQuotes} from '../../../lib/live-quote-adapter'
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

 let liquidity = [] as ReturnType<typeof getFlashLiquidity>
 let liquidityError: string | undefined
 try { liquidity=getFlashLiquidity() }
 catch (error) { liquidityError=error instanceof Error ? error.message : 'FLASH_LIQUIDITY_CONFIGURATION_ERROR' }

 const opportunities=discoverOpportunities(quotes)
 const graph=buildOpportunityGraph(liquidity,quotes)
 const assurance=assessOpportunityCoverage(quotes,liquidity,opportunities)
 const candidates=opportunities.map(o=>({...o}))
 const result=evaluateCandidates(candidates,{targetProfit:target,minNetProfit:runtimeConfig.minNetProfitUsd,safetyReserve:runtimeConfig.safetyReserveUsd,maxPaths:runtimeConfig.maxPathsPerCycle,maxCycles:runtimeConfig.maxCycles})

 return NextResponse.json({
   status:adapterError||liquidityError?'live-readiness-error':'live-quotes',
   liveExecution:runtimeConfig.liveExecution,
   quoteCount:quotes.length,
   opportunityCount:opportunities.length,
   assurance,
   routeGraph:{
     routeCount:graph.length,
     freshRouteCount:graph.filter(r=>r.quoteFresh).length,
     liquidityCoveredRouteCount:graph.filter(r=>r.liquidityUsd>0).length,
     routes:graph,
   },
   ...result,
   adapterError,
   liquidityError,
   message:adapterError||liquidityError
     ? 'Live market/liquidity configuration is incomplete; no transaction is submitted.'
     : assurance.status==='NO_PROFITABLE_PATHS'
       ? 'Live coverage is healthy, but no positive-net opportunity currently clears the profitability gate.'
       : assurance.status==='PARTIAL_COVERAGE'
         ? 'Live coverage is partial. Expand or rotate routes before execution.'
         : assurance.status==='NO_FRESH_QUOTES'
           ? 'Routes are configured but quote freshness is insufficient. Refresh before execution.'
           : 'Live routes are read from configured on-chain sources. No transaction is submitted by scan.',
 })
}
