import {type ExecutionDecision, validateExecutionPlan, type ExecutionPlan} from './execution-plan'
import {checkRepayment, type RepaymentCheck} from './route-repayment'
import {validateAtomicRepaymentProof, type AtomicRepaymentProof} from './atomic-repayment-proof'

export type PreExecutionRequest = {
  plan: ExecutionPlan
  finalTokenAmount: bigint
  loanAmountToken: bigint
  feeAmountToken: bigint
  simulationOk: boolean
  simulationError?: string
  atomicRepaymentProof: AtomicRepaymentProof
}

export type PreExecutionDecision = {
  authorized: boolean
  reasons: string[]
  execution: ExecutionDecision
  repayment: RepaymentCheck
  atomicRepayment: {verified: boolean; reason?: string}
}

export function validatePreExecution(request:PreExecutionRequest):PreExecutionDecision {
  const execution = validateExecutionPlan(request.plan)
  const repayment = checkRepayment(request.loanAmountToken, request.feeAmountToken, request.finalTokenAmount)
  const atomicRepayment = validateAtomicRepaymentProof(request.atomicRepaymentProof)
  const reasons = [...execution.reasons]

  if (!repayment.sufficient) reasons.push('INSUFFICIENT_TOKEN_REPAYMENT')
  if (!request.simulationOk) reasons.push(request.simulationError ? `SIMULATION_FAILED:${request.simulationError}` : 'SIMULATION_FAILED')
  if (!atomicRepayment.verified) reasons.push(atomicRepayment.reason ?? 'ATOMIC_REPAYMENT_PROOF_FAILED')

  return {
    authorized: reasons.length === 0,
    reasons,
    execution,
    repayment,
    atomicRepayment,
  }
}
