import {NextResponse} from 'next/server'
import {latestBlock} from '../../../lib/rpc'
export const dynamic='force-dynamic'
export async function GET(){
 try{return NextResponse.json({ok:true,service:'INSTA-FLOAN',network:'ethereum-mainnet',block:await latestBlock(),timestamp:new Date().toISOString()})}
 catch(error){return NextResponse.json({ok:false,error:error instanceof Error?error.message:'RPC error',timestamp:new Date().toISOString()},{status:503})}
}
