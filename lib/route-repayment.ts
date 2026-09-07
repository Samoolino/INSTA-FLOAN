export type RepaymentCheck = {
  loanAmount: bigint
  feeAmount: bigint
  expectedFinalAmount: bigint
  requiredRepayment: bigint
  surplus: bigint
  sufficient: boolean
}

export function checkRepayment(loanAmount: bigint, feeAmount: bigint, expectedFinalAmount: bigint): RepaymentCheck {
  if (loanAmount <= 0n) throw new Error('INVALID_LOAN_AMOUNT')
  if (feeAmount < 0n) throw new Error('INVALID_FEE_AMOUNT')
  if (expectedFinalAmount <= 0n) throw new Error('INVALID_FINAL_AMOUNT')

  const requiredRepayment = loanAmount + feeAmount
  const surplus = expectedFinalAmount - requiredRepayment
  return {
    loanAmount,
    feeAmount,
    expectedFinalAmount,
    requiredRepayment,
    surplus: surplus > 0n ? surplus : 0n,
    sufficient: surplus >= 0n,
  }
}
