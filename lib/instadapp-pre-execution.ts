import {type Address, type Hex} from 'viem'
import {type ExecutionPlan} from './execution-plan'
import {validatePreExecution, type PreExecutionDecision} from './pre-execution-gate'
import {simulateInstadappCast, type InstadappSimulationResult} from './instadapp-simulation'

export type InstadappPreExecutionRequest = {
  plan: ExecutionPlan
  smartAccount: Address
  targets: Address[]
  datas: Hex[]
  origin: Address
  rpcUrl: string
  expectedBlockNumber?: bigint
  finalTokenAmount: bigint
  loanAmountToken: bigint
  feeAmountToken: bigint
}

export type InstadappPreExecutionResult = PreExecutionDecision & {
  instadapp: InstadappSimulationResult
}

/**
 * Executes the complete Instadapp cast simulation boundary before the existing
 * repayment, profit, and safety authorization gates.
 *
 * This remains authorization-only: it never signs, submits, or broadcasts.
 * The caller must provide already-verified target calldata. No flash-loan
 * connector/module address or ABI is assumed by this orchestration layer.
 */
export async function runInstadappPreExecution(
  request: InstadappPreExecutionRequest,
): Promise<InstadappPreExecutionResult> {
  const instadapp = await simulateInstadappCast({
    smartAccount: request.smartAccount,
    targets: request.targets,
    datas: request.datas,
    origin: request.origin,
    rpcUrl: request.rpcUrl,
    expectedBlockNumber: request.expectedBlockNumber,
  })

  const decision = validatePreExecution({
    plan: request.plan,
    finalTokenAmount: request.finalTokenAmount,
    loanAmountToken: request.loanAmountToken,
    feeAmountToken: request.feeAmountToken,
    simulationOk: instadapp.simulation.ok,
    simulationError: instadapp.simulation.ok ? undefined : instadapp.simulation.error,
  })

  return { ...decision, instadapp }
}
