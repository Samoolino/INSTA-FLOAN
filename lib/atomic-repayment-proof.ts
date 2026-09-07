export type AtomicRepaymentProof = {
  simulationSucceeded: boolean
  requiredRepaymentAmount: bigint
}

/**
 * A successful atomic flash-loan transaction is repayment evidence only when
 * the integrated lender/connector is known to revert the atomic transaction
 * if the required repayment is not made. This gate therefore never treats a
 * quote, post-state balance, or caller-supplied final amount as repayment proof.
 *
 * Protocol-specific enforcement must be verified before this result is used
 * for live authorization. The application remains simulation-only.
 */
export function validateAtomicRepaymentProof(
  proof: AtomicRepaymentProof,
): {verified: boolean; reason?: string} {
  if (proof.requiredRepaymentAmount <= 0n) {
    throw new Error('INVALID_REQUIRED_REPAYMENT_AMOUNT')
  }
  if (!proof.simulationSucceeded) {
    return {verified: false, reason: 'ATOMIC_SIMULATION_FAILED'}
  }
  return {verified: true}
}
