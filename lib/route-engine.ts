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

const finiteNonNegative = (value:number) => Number.isFinite(value) && value >= 0
const finitePositive = (value:number) => Number.isFinite(value) && value > 0

export function evaluateRoute(route: RouteCandidate, minNetProfitUsd: number, safetyReserveUsd: number): RouteEvaluation {
  if (route.legs.length < 2) throw new Error('ROUTE_REQUIRES_TWO_LEGS')
  if (!Number.isInteger(route.chainId) || route.chainId <= 0) throw new Error('INVALID_CHAIN')
  if (!route.loanAsset) throw new Error('MISSING_LOAN_ASSET')
  if (route.loanAmount <= 0n) throw new Error('INVALID_LOAN_AMOUNT')
  if (route.expectedFinalAmount <= 0n) throw new Error('INVALID_FINAL_AMOUNT')
  if (!finitePositive(route.expectedFinalUsd) || !finitePositive(route.loanAmountUsd)) throw new Error('INVALID_USD_NOTIONAL')
  if (!finiteNonNegative(route.flashLoanFeeUsd) || !finiteNonNegative(route.gasUsd) || !finiteNonNegative(route.slippageUsd)) throw new Error('INVALID_ROUTE_COST')
  if (!finitePositive(minNetProfitUsd)) throw new Error('INVALID_MIN_NET_PROFIT')
  if (!finiteNonNegative(safetyReserveUsd)) throw new Error('INVALID_SAFETY_RESERVE')

  const first = route.legs[0]
  const last = route.legs[route.legs.length - 1]
  if (first.chainId !== route.chainId || last.chainId !== route.chainId) throw new Error('CHAIN_MISMATCH')
  if (first.tokenIn.toLowerCase() !== route.loanAsset.toLowerCase()) throw new Error('LOAN_ASSET_PATH_MISMATCH')
  if (last.tokenOut.toLowerCase() !== route.loanAsset.toLowerCase()) throw new Error('FINAL_ASSET_PATH_MISMATCH')
  for (let i=1; i<route.legs.length; i++) {
    if (route.legs[i-1].tokenOut.toLowerCase() !== route.legs[i].tokenIn.toLowerCase()) throw new Error('LEG_CONTINUITY_MISMATCH')
    if (route.legs[i].amountIn !== route.legs[i-1].amountOut) throw new Error('LEG_AMOUNT_MISMATCH')
  }
  if (first.amountIn !== route.loanAmount) throw new Error('INITIAL_AMOUNT_MISMATCH')
  if (last.amountOut !== route.expectedFinalAmount) throw new Error('FINAL_AMOUNT_MISMATCH')

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
