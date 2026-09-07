import {NextResponse} from 'next/server'
import {evaluateCandidates} from '../../../lib/target-engine'
export const dynamic='force-dynamic'
export async function GET(){
 const target=Number(process.env.TARGET_PROFIT_USD||100)
 const min=Number(process.env.MIN_NET_PROFIT_USD||5)
 const reserve=Number(process.env.SAFETY_RESERVE_USD||2)
 const maxPaths=Number(process.env.MAX_PATHS_PER_CYCLE||25)
 // Placeholder candidates: live DEX quote adapters will replace these values.
 const candidates=[]
 const result=evaluateCandidates(candidates,{targetProfit:target,minNetProfit:min,safetyReserve:reserve,maxPaths,maxCycles:Number(process.env.MAX_CYCLES||100)})
 return NextResponse.json({status:'simulation-only',liveExecution:false,...result,message:'No transaction is submitted. Configure live quote adapters and fork simulation before enabling execution.'})
}
