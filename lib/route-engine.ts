import {type ExecutionPlan} from './execution-plan'

export type RouteLeg = {
  venue: string
  chainId: number
  tokenIn: string
  tokenOut: string
  amountIn: bigint
  amountOut: bigint
}

export type RouteCandidate = {
  chainId: number
  loanAsset: string
  loanAmount: bigint
  loanAmountUsd: number
  expectedFinalAmount: bigint
  expectedFinalUsd: number
  flashLoanFeeUsd: number
  gasUsd: number
  slippageUsd: number
  legs: RouteLeg[]
}

export type RouteEvaluation = {
  plan: ExecutionPlan
  route: RouteCandidate
  profitable: boolean
}

export function evaluateRoute(route: RouteCandidate, minNetProfitUsd: number, safetyReserveUsd: number): RouteEvaluation {
  if (route.legs.length < 2) throw new Error('ROUTE_REQUIRES_TWO_LEGS')
  if (route.loanAmount <= 0n) throw new Error('INVALID_LOAN_AMOUNT')
  if (route.expectedFinalAmount <= 0n) throw new Error('INVALID_FINAL_AMOUNT')
  if (route.expectedFinalUsd <= 0 || route.loanAmountUsd <= 0) throw new Error('INVALID_USD_NOTIONAL')

  const swapCostUsd = 0
  const grossProfitUsd = route.expectedFinalUsd - route.loanAmountUsd
  const netProfitUsd = grossProfitUsd - route.flashLoanFeeUsd - swapCostUsd - route.gasUsd - route.slippageUsd

  const plan: ExecutionPlan = {
    chainId: route.chainId,
    loanAsset: route.loanAsset,
    loanAmountUsd: route.loanAmountUsd,
    flashLoanFeeUsd: route.flashLoanFeeUsd,
    swapCostUsd,
    gasUsd: route.gasUsd,
    slippageUsd: route.slippageUsd,
    grossProfitUsd,
    netProfitUsd,
    minNetProfitUsd,
    safetyReserveUsd,
  }

  return {plan, route, profitable: netProfitUsd >= minNetProfitUsd && netProfitUsd > safetyReserveUsd}
}
