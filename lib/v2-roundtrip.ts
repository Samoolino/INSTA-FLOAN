import {quoteUniswapV2, type V2QuoteConfig, type V2Quote} from './uniswap-v2'
import {buildRoundTrip, type RoundTripConfig} from './route-builder'
import {evaluateRoute, type RouteEvaluation} from './route-engine'

type V2LegEconomics = {
  /** Explicit DEX/router fee attributable to this quote leg, in USD. */
  feeUsd?: number
}

export type V2RoundTripConfig = {
  first: Omit<V2QuoteConfig,'amountIn'|'expectedBlockNumber'> & {amountIn:bigint} & V2LegEconomics
  second: Omit<V2QuoteConfig,'amountIn'|'expectedBlockNumber'> & V2LegEconomics
  route: RoundTripConfig
  minNetProfitUsd:number
  safetyReserveUsd:number
}

export type V2RoundTripResult = {
  first:V2Quote
  second:V2Quote
  evaluation:RouteEvaluation
}

function toQuoteLike(quote:V2Quote, feeUsd:number|undefined) {
  if (feeUsd === undefined) throw new Error('EXPLICIT_DEX_FEE_REQUIRED')
  if (!Number.isFinite(feeUsd) || feeUsd < 0) throw new Error('INVALID_DEX_FEE')

  return {
    venue:quote.router,
    chainId:quote.chainId,
    tokenIn:quote.path[0],
    tokenOut:quote.path[quote.path.length - 1],
    amountIn:quote.amountIn,
    amountOut:quote.amountOut,
    feeUsd,
  }
}

/**
 * Obtains two on-chain V2 quotes and evaluates the resulting closed route.
 * Leg two is pinned to leg one's block and consumes leg one's exact output.
 * DEX/router fees must be explicitly supplied; they are never inferred as zero.
 */
export async function quoteAndEvaluateV2RoundTrip(config:V2RoundTripConfig):Promise<V2RoundTripResult>{
  const first=await quoteUniswapV2(config.first)
  const second=await quoteUniswapV2({...config.second,amountIn:first.amountOut,expectedBlockNumber:first.blockNumber})
  if (second.blockNumber !== first.blockNumber) throw new Error('BLOCK_CHANGED_BETWEEN_LEGS')

  const route=buildRoundTrip(
    toQuoteLike(first,config.first.feeUsd),
    toQuoteLike(second,config.second.feeUsd),
    config.route,
  )
  const evaluation=evaluateRoute(route,config.minNetProfitUsd,config.safetyReserveUsd)
  return {first,second,evaluation}
}
