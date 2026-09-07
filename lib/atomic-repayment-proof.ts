export type AtomicRepaymentProof = {
  simulationSucceeded: boolean
  requiredRepaymentAmount: bigint
  /** True only after the lender/connector's atomic-revert repayment semantics have been independently verified. */
  repaymentEnforcementVerified: boolean
}

/**
 * A successful atomic flash-loan transaction is repayment evidence only when
 * the integrated lender/connector is known to revert the atomic transaction
 * if the required repayment is not made. This gate therefore never treats a
 * quote, post-state balance, or caller-supplied final amount as repayment proof.
 *
 * Protocol-specific enforcement must be explicitly verified before this result
 * can authorize anything. The application remains simulation-only.
 */
export function validateAtomicRepaymentProof(
  proof: AtomicRepaymentProof,
): {verified: boolean; reason?: string} {
  if (proof.requiredRepaymentAmount <= 0n) {
    throw new Error('INVALID_REQUIRED_REPAYMENT_AMOUNT')
  }
  if (!proof.repaymentEnforcementVerified) {
    return {verified: false, reason: 'REPAYMENT_ENFORCEMENT_NOT_VERIFIED'}
  }
  if (!proof.simulationSucceeded) {
    return {verified: false, reason: 'ATOMIC_SIMULATION_FAILED'}
  }
  return {verified: true}
}
