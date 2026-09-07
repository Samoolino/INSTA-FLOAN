import {type ExecutionPlan} from './execution-plan'
import {validatePreExecution, type PreExecutionDecision} from './pre-execution-gate'
import {simulateCall, type SimulationRequest} from './route-simulation'

export type PreExecutionOrchestrationRequest = {
  plan: ExecutionPlan
  simulation: SimulationRequest
  finalTokenAmount: bigint
  loanAmountToken: bigint
  feeAmountToken: bigint
}

export type PreExecutionOrchestrationResult = PreExecutionDecision & {
  simulation: Awaited<ReturnType<typeof simulateCall>>
}

/**
 * Runs the RPC simulation itself before evaluating the existing atomic gates.
 * This prevents callers from asserting simulationOk=true without an actual eth_call.
 * This remains authorization-only; it never signs or submits a transaction.
 */
export async function runPreExecutionOrchestration(
  request: PreExecutionOrchestrationRequest,
): Promise<PreExecutionOrchestrationResult> {
  const simulation = await simulateCall(request.simulation)
  const decision = validatePreExecution({
    plan: request.plan,
    finalTokenAmount: request.finalTokenAmount,
    loanAmountToken: request.loanAmountToken,
    feeAmountToken: request.feeAmountToken,
    simulationOk: simulation.ok,
    simulationError: simulation.ok ? undefined : simulation.error,
  })

  return { ...decision, simulation }
}
