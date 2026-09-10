import {NextResponse} from 'next/server'
import {evaluateCandidates} from '../../../lib/target-engine'
import {discoverOpportunities} from '../../../lib/market'
import {getLiveQuotes} from '../../../lib/live-quote-adapter'
import {runtimeConfig} from '../../../lib/config'

export const dynamic='force-dynamic'

export async function GET(request:Request){
 const {searchParams}=new URL(request.url)
 const requestedTarget=Number(searchParams.get('target'))
 const target=Number.isFinite(requestedTarget)&&requestedTarget>0 ? requestedTarget : runtimeConfig.targetProfitUsd

 let quotes=[]
 let adapterError: string | undefined
 try {
   quotes=await getLiveQuotes()
 } catch (error) {
   adapterError=error instanceof Error ? error.message : 'LIVE_QUOTE_ADAPTER_ERROR'
 }

 const opportunities=discoverOpportunities(quotes)
 const candidates=opportunities.map(o=>({...o}))
 const result=evaluateCandidates(candidates,{targetProfit:target,minNetProfit:runtimeConfig.minNetProfitUsd,safetyReserve:runtimeConfig.safetyReserveUsd,maxPaths:runtimeConfig.maxPathsPerCycle,maxCycles:runtimeConfig.maxCycles})

 return NextResponse.json({
   status: adapterError ? 'live-quote-error' : 'live-quotes',
   liveExecution:runtimeConfig.liveExecution,
   quoteCount:quotes.length,
   opportunityCount:opportunities.length,
   ...result,
   adapterError,
   message:adapterError
     ? 'Live quote adapter failed or is not configured; no transaction is submitted.'
     : 'Quotes are read from explicitly configured on-chain routers. No transaction is submitted by scan.',
 })
}
