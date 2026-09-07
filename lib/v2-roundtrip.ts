import {type Address} from 'viem'
import {quoteUniswapV2, type V2QuoteConfig, type V2Quote} from './uniswap-v2'
import {buildRoundTrip, type RoundTripConfig} from './route-builder'
import {evaluateRoute, type RouteEvaluation} from './route-engine'

export type V2RoundTripConfig = {
  first: Omit<V2QuoteConfig,'amountIn'|'expectedBlockNumber'> & {amountIn:bigint}
  second: Omit<V2QuoteConfig,'amountIn'|'expectedBlockNumber'>
  route: RoundTripConfig
  minNetProfitUsd:number
  safetyReserveUsd:number
  maxBlockDrift?:number
}

export type V2RoundTripResult = {
  first:V2Quote
  second:V2Quote
  evaluation:RouteEvaluation
}

export async function quoteAndEvaluateV2RoundTrip(config:V2RoundTripConfig):Promise<V2RoundTripResult>{
  const first=await quoteUniswapV2(config.first)
  const second=await quoteUniswapV2({...config.second,amountIn:first.amountOut,expectedBlockNumber:first.blockNumber})
  if (second.blockNumber !== first.blockNumber) throw new Error('BLOCK_CHANGED_BETWEEN_LEGS')
  if (config.maxBlockDrift !== undefined && config.maxBlockDrift < 0) throw new Error('INVALID_MAX_BLOCK_DRIFT')

  const route=buildRoundTrip(first,second,{...config.route,finalAmountUsd:config.route.finalAmountUsd})
  const evaluation=evaluateRoute(route,config.minNetProfitUsd,config.safetyReserveUsd)
  return {first,second,evaluation}
}

export type VerifiedRouter = {address:Address; label:string}
