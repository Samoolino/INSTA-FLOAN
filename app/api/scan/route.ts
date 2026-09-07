import {NextResponse} from 'next/server'
import {evaluateCandidates} from '../../../lib/target-engine'
import {discoverOpportunities, type Quote} from '../../../lib/market'
import {runtimeConfig} from '../../../lib/config'

export const dynamic='force-dynamic'

export async function GET(request:Request){
 const {searchParams}=new URL(request.url)
 const requestedTarget=Number(searchParams.get('target'))
 const target=Number.isFinite(requestedTarget)&&requestedTarget>0 ? requestedTarget : runtimeConfig.targetProfitUsd

 // Simulation boundary: an external quote adapter may be attached here later.
 // No transaction submission or wallet signing occurs in this route.
 const quotes: Quote[]=[]
 const opportunities=discoverOpportunities(quotes)
 const candidates=opportunities.map(o=>({...o}))
 const result=evaluateCandidates(candidates,{targetProfit:target,minNetProfit:runtimeConfig.minNetProfitUsd,safetyReserve:runtimeConfig.safetyReserveUsd,maxPaths:runtimeConfig.maxPathsPerCycle,maxCycles:runtimeConfig.maxCycles})

 return NextResponse.json({
   status:'simulation-only',
   liveExecution:false,
   quoteCount:quotes.length,
   opportunityCount:opportunities.length,
   ...result,
   message:'No transaction is submitted. Live quote adapters and route simulation remain required before execution can be enabled.'
 })
}
