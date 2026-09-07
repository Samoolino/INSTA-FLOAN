import {quoteUniswapV2, type V2QuoteConfig, type V2Quote} from './uniswap-v2'
import {buildRoundTrip, type RoundTripConfig} from './route-builder'
import {evaluateRoute, type RouteEvaluation} from './route-engine'

export type V2RoundTripConfig = {
  first: Omit<V2QuoteConfig,'amountIn'|'expectedBlockNumber'> & {amountIn:bigint}
  second: Omit<V2QuoteConfig,'amountIn'|'expectedBlockNumber'>
  route: RoundTripConfig
  minNetProfitUsd:number
  safetyReserveUsd:number
}

export type V2RoundTripResult = {
  first:V2Quote
  second:V2Quote
  evaluation:RouteEvaluation
}

/**
 * Obtains two on-chain V2 quotes and evaluates the resulting closed route.
 * Leg two is pinned to leg one's block and consumes leg one's exact output.
 */
export async function quoteAndEvaluateV2RoundTrip(config:V2RoundTripConfig):Promise<V2RoundTripResult>{
  const first=await quoteUniswapV2(config.first)
  const second=await quoteUniswapV2({...config.second,amountIn:first.amountOut,expectedBlockNumber:first.blockNumber})
  if (second.blockNumber !== first.blockNumber) throw new Error('BLOCK_CHANGED_BETWEEN_LEGS')

  const route=buildRoundTrip(first,second,config.route)
  const evaluation=evaluateRoute(route,config.minNetProfitUsd,config.safetyReserveUsd)
  return {first,second,evaluation}
}
