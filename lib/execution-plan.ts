export type ExecutionPlan = {
  chainId: number
  loanAsset: string
  loanAmountUsd: number
  flashLoanFeeUsd: number
  swapCostUsd: number
  gasUsd: number
  slippageUsd: number
  grossProfitUsd: number
  netProfitUsd: number
  minNetProfitUsd: number
  safetyReserveUsd: number
}

export type ExecutionDecision = {
  executable: boolean
  reasons: string[]
  repaymentUsd: number
}

const finiteNonNegative = (n: number) => Number.isFinite(n) && n >= 0
const finitePositive = (n: number) => Number.isFinite(n) && n > 0

export function validateExecutionPlan(plan: ExecutionPlan): ExecutionDecision {
  const reasons: string[] = []
  if (!Number.isInteger(plan.chainId) || plan.chainId <= 0) reasons.push('INVALID_CHAIN')
  if (!plan.loanAsset) reasons.push('MISSING_LOAN_ASSET')
  if (!finitePositive(plan.loanAmountUsd)) reasons.push('INVALID_LOAN_AMOUNT')
  if (!finiteNonNegative(plan.flashLoanFeeUsd)) reasons.push('INVALID_FLASH_LOAN_FEE')
  if (!finiteNonNegative(plan.swapCostUsd)) reasons.push('INVALID_SWAP_COST')
  if (!finiteNonNegative(plan.gasUsd)) reasons.push('INVALID_GAS')
  if (!finiteNonNegative(plan.slippageUsd)) reasons.push('INVALID_SLIPPAGE')
  if (!finiteNonNegative(plan.grossProfitUsd)) reasons.push('INVALID_GROSS_PROFIT')
  if (!finitePositive(plan.minNetProfitUsd)) reasons.push('INVALID_MIN_NET_PROFIT')
  if (!finiteNonNegative(plan.safetyReserveUsd)) reasons.push('INVALID_SAFETY_RESERVE')

  const repaymentUsd = plan.loanAmountUsd + plan.flashLoanFeeUsd
  const modeledCosts = plan.flashLoanFeeUsd + plan.swapCostUsd + plan.gasUsd + plan.slippageUsd
  const modeledNet = plan.grossProfitUsd - modeledCosts

  if (Math.abs(modeledNet - plan.netProfitUsd) > 0.01) reasons.push('NET_PROFIT_MISMATCH')
  if (plan.netProfitUsd < plan.minNetProfitUsd) reasons.push('BELOW_MIN_NET_PROFIT')
  if (plan.netProfitUsd <= plan.safetyReserveUsd) reasons.push('SAFETY_RESERVE_NOT_CLEARED')
  if (plan.netProfitUsd <= 0) reasons.push('NON_POSITIVE_NET_PROFIT')

  return {executable: reasons.length === 0, reasons, repaymentUsd}
}
