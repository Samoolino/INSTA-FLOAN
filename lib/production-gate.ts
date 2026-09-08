export type ProductionExecutionGateInput = {
  liveExecution: boolean
  controlledForkValidated: boolean
  controlledForkValidationId: string
  controlledForkAttestation: string
  walletAuthorized: boolean
  contractsVerified: boolean
  atomicRepaymentVerified: boolean
  simulationRequired: boolean
  simulationPassed: boolean
  riskGatesEnabled: boolean
  netProfitGateEnabled: boolean
  killSwitchEnabled: boolean
}

export function assertProductionExecutionGate(input: ProductionExecutionGateInput) {
  if (!input.liveExecution) {
    throw new Error('PRODUCTION_EXECUTION_DISABLED:LIVE_EXECUTION=false')
  }
  if (!input.controlledForkValidated) {
    throw new Error('PRODUCTION_GATE_REQUIRED:CONTROLLED_FORK_VALIDATION')
  }
  if (!input.controlledForkValidationId.trim()) {
    throw new Error('PRODUCTION_GATE_REQUIRED:CONTROLLED_FORK_VALIDATION_ID')
  }
  if (!input.controlledForkAttestation.trim()) {
    throw new Error('PRODUCTION_GATE_REQUIRED:CONTROLLED_FORK_ATTESTATION')
  }
  if (!input.walletAuthorized) {
    throw new Error('PRODUCTION_GATE_REQUIRED:WALLET_AUTHORIZATION')
  }
  if (!input.contractsVerified) {
    throw new Error('PRODUCTION_GATE_REQUIRED:CONTRACT_VERIFICATION')
  }
  if (!input.atomicRepaymentVerified) {
    throw new Error('PRODUCTION_GATE_REQUIRED:ATOMIC_REPAYMENT_VERIFICATION')
  }
  if (!input.simulationRequired || !input.simulationPassed) {
    throw new Error('PRODUCTION_GATE_REQUIRED:SUCCESSFUL_SIMULATION')
  }
  if (!input.riskGatesEnabled) {
    throw new Error('PRODUCTION_GATE_REQUIRED:RISK_GATES')
  }
  if (!input.netProfitGateEnabled) {
    throw new Error('PRODUCTION_GATE_REQUIRED:NET_PROFIT_GATE')
  }
  if (!input.killSwitchEnabled) {
    throw new Error('PRODUCTION_GATE_REQUIRED:OPERATOR_KILL_SWITCH')
  }

  return {allowed: true as const}
}
