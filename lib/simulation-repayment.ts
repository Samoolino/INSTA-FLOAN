export type SimulationRepaymentResult = {
  actualFinalAmount: bigint
  requiredRepaymentAmount: bigint
  surplusAmount: bigint
  sufficient: boolean
}

/**
 * Converts the actual post-swap token amount observed from an atomic simulation
 * into the repayment decision. Quotes are not used as proof of repayment.
 */
export function validateSimulatedRepayment(
  actualFinalAmount: bigint,
  requiredRepaymentAmount: bigint,
): SimulationRepaymentResult {
  if (actualFinalAmount < 0n) throw new Error('INVALID_ACTUAL_FINAL_AMOUNT')
  if (requiredRepaymentAmount <= 0n) throw new Error('INVALID_REQUIRED_REPAYMENT_AMOUNT')

  const sufficient = actualFinalAmount >= requiredRepaymentAmount
  return {
    actualFinalAmount,
    requiredRepaymentAmount,
    surplusAmount: sufficient ? actualFinalAmount - requiredRepaymentAmount : 0n,
    sufficient,
  }
}
