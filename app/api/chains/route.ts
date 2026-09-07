import {NextResponse} from 'next/server'
import {checkChains, type ChainEndpoint} from '../../../lib/chain-health'

export const dynamic='force-dynamic'

export async function GET(){
  const endpoints:ChainEndpoint[] = [
    {name:'ethereum',chainId:1,rpcUrl:process.env.ETH_RPC_URL || ''},
    {name:'arbitrum',chainId:42161,rpcUrl:process.env.ARB_RPC_URL || ''},
    {name:'base',chainId:8453,rpcUrl:process.env.BASE_RPC_URL || ''},
    {name:'bsc',chainId:56,rpcUrl:process.env.BSC_RPC_URL || ''},
  ]
  const chains=await checkChains(endpoints)
  return NextResponse.json({ok:chains.every(c=>c.ok),chains,timestamp:new Date().toISOString()})
}
