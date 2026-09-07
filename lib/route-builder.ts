import {type RouteCandidate, type RouteLeg} from './route-engine'

type QuoteLike = {
  venue: string
  chainId: number
  tokenIn: string
  tokenOut: string
  amountIn: bigint
  amountOut: bigint
  /** Explicit router/DEX fee attributable to this quote leg, in USD. */
  feeUsd: number
}

export type RoundTripConfig = {
  chainId: number
  loanAsset: string
  loanAmount: bigint
  loanAmountUsd: number
  flashLoanFeeUsd: number
  gasUsd: number
  slippageUsd: number
  finalAmountUsd: number
}

const same = (a:string,b:string) => a.toLowerCase() === b.toLowerCase()

/**
 * Composes two already-verified on-chain quotes into a closed round-trip.
 * The second leg consumes the exact output of the first leg; no amount or
 * price is invented by this builder. DEX fees must be explicitly supplied.
 */
export function buildRoundTrip(first:QuoteLike, second:QuoteLike, config:RoundTripConfig):RouteCandidate {
  if (first.chainId !== config.chainId || second.chainId !== config.chainId) throw new Error('CHAIN_MISMATCH')
  if (!same(first.tokenIn, config.loanAsset)) throw new Error('FIRST_LEG_LOAN_ASSET_MISMATCH')
  if (!same(second.tokenOut, config.loanAsset)) throw new Error('SECOND_LEG_FINAL_ASSET_MISMATCH')
  if (!same(first.tokenOut, second.tokenIn)) throw new Error('QUOTE_TOKEN_CONTINUITY_MISMATCH')
  if (first.amountIn !== config.loanAmount) throw new Error('FIRST_LEG_AMOUNT_MISMATCH')
  if (second.amountIn !== first.amountOut) throw new Error('SECOND_LEG_AMOUNT_MISMATCH')
  if (second.amountOut <= 0n) throw new Error('INVALID_FINAL_AMOUNT')
  if (!Number.isFinite(first.feeUsd) || first.feeUsd < 0) throw new Error('INVALID_FIRST_LEG_FEE')
  if (!Number.isFinite(second.feeUsd) || second.feeUsd < 0) throw new Error('INVALID_SECOND_LEG_FEE')

  const legs:RouteLeg[] = [
    {venue:first.venue,chainId:first.chainId,tokenIn:first.tokenIn,tokenOut:first.tokenOut,amountIn:first.amountIn,amountOut:first.amountOut,feeUsd:first.feeUsd},
    {venue:second.venue,chainId:second.chainId,tokenIn:second.tokenIn,tokenOut:second.tokenOut,amountIn:second.amountIn,amountOut:second.amountOut,feeUsd:second.feeUsd},
  ]

  return {
    chainId:config.chainId,
    loanAsset:config.loanAsset,
    loanAmount:config.loanAmount,
    loanAmountUsd:config.loanAmountUsd,
    expectedFinalAmount:second.amountOut,
    expectedFinalUsd:config.finalAmountUsd,
    flashLoanFeeUsd:config.flashLoanFeeUsd,
    gasUsd:config.gasUsd,
    slippageUsd:config.slippageUsd,
    legs,
  }
}
