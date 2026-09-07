import {NextResponse} from 'next/server'
import {evaluateCandidates} from '../../../lib/target-engine'

export const dynamic='force-dynamic'

export async function GET(request:Request){
 const {searchParams}=new URL(request.url)
 const requestedTarget=Number(searchParams.get('target'))
 const target=Number.isFinite(requestedTarget)&&requestedTarget>0
   ? requestedTarget
   : Number(process.env.TARGET_PROFIT_USD||100)
 const min=Number(process.env.MIN_NET_PROFIT_USD||5)
 const reserve=Number(process.env.SAFETY_RESERVE_USD||2)
 const maxPaths=Number(process.env.MAX_PATHS_PER_CYCLE||25)
 const maxCycles=Number(process.env.MAX_CYCLES||100)

 // Production safety boundary: quote adapters and transaction simulation must be
 // implemented before any candidate can become executable.
 const candidates=[]
 const result=evaluateCandidates(candidates,{targetProfit:target,minNetProfit:min,safetyReserve:reserve,maxPaths,maxCycles})

 return NextResponse.json({
   status:'simulation-only',
   liveExecution:false,
   ...result,
   message:'No transaction is submitted. Configure verified live quote adapters and fork simulation before enabling execution.'
 })
}
