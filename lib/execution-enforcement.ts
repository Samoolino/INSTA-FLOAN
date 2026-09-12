export type EnforcementDecision = 'BLOCKED' | 'ELIGIBLE_FOR_AUTHORIZATION'

export type EnforcementPolicy = {
  maxPriorityFeeGwei: number
  maxBribeBps: number
  maxGasMultiplier: number
  maxGasUsd: number
  minNetProfitAfterEnforcementUsd: number
  deadlineSeconds: number
  privateRelayPreferred: boolean
  bundleRequired: boolean
  nonceLockRequired: boolean
  revalidateBeforeSend: boolean
}

export type EnforcementAssessment = {
  decision: EnforcementDecision
  mode: 'POLICY_ONLY' | 'READY_FOR_AUTHORIZATION'
  reasons: string[]
  estimatedEnforcementCostUsd: number
  requiredNetProfitUsd: number
  policy: EnforcementPolicy
}

const positive = (value: string | undefined, fallback: number) => {
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

const bool = (value: string | undefined, fallback: boolean) => {
  if (value === undefined || value === '') return fallback
  return value.toLowerCase() === 'true'
}

export function getEnforcementPolicy(): EnforcementPolicy {
  return {
    maxPriorityFeeGwei: positive(process.env.ENFORCEMENT_MAX_PRIORITY_FEE_GWEI, 3),
    maxBribeBps: Math.max(0, Math.floor(Number(process.env.ENFORCEMENT_MAX_BRIBE_BPS ?? 25))),
    maxGasMultiplier: Math.max(1, positive(process.env.ENFORCEMENT_MAX_GAS_MULTIPLIER, 1.5)),
    maxGasUsd: positive(process.env.ENFORCEMENT_MAX_GAS_USD, 25),
    minNetProfitAfterEnforcementUsd: positive(process.env.ENFORCEMENT_MIN_NET_PROFIT_USD, 10),
    deadlineSeconds: Math.max(5, Math.floor(positive(process.env.ENFORCEMENT_DEADLINE_SECONDS, 20))),
    privateRelayPreferred: bool(process.env.ENFORCEMENT_PRIVATE_RELAY_PREFERRED, true),
    bundleRequired: bool(process.env.ENFORCEMENT_BUNDLE_REQUIRED, false),
    nonceLockRequired: bool(process.env.ENFORCEMENT_NONCE_LOCK_REQUIRED, true),
    revalidateBeforeSend: bool(process.env.ENFORCEMENT_REVALIDATE_BEFORE_SEND, true),
  }
}

export function assessExecutionEnforcement(input: {
  grossProfitUsd: number
  baseNetProfitUsd: number
  estimatedGasUsd: number
  estimatedBribeUsd?: number
  routeFresh: boolean
  simulationPassed: boolean
  atomicRepaymentValidated: boolean
  controlledForkValidated: boolean
  walletAuthorized: boolean
  riskLimitsValidated: boolean
  profitabilityValidated: boolean
  slippageGasValidated: boolean
  executionPathEnabled: boolean
  killSwitchEnabled: boolean
}): EnforcementAssessment {
  const policy = getEnforcementPolicy()
  const bribe = Math.max(0, input.estimatedBribeUsd ?? 0)
  const gas = Math.max(0, input.estimatedGasUsd)
  const enforcementCost = gas * Math.max(0, policy.maxGasMultiplier - 1) + bribe
  const requiredNet = policy.minNetProfitAfterEnforcementUsd
  const reasons: string[] = []

  if (!input.routeFresh) reasons.push('ROUTE_NOT_FRESH')
  if (!input.simulationPassed) reasons.push('SIMULATION_NOT_PASSED')
  if (!input.atomicRepaymentValidated) reasons.push('ATOMIC_REPAYMENT_NOT_VALIDATED')
  if (!input.controlledForkValidated) reasons.push('CONTROLLED_FORK_NOT_VALIDATED')
  if (!input.walletAuthorized) reasons.push('WALLET_NOT_AUTHORIZED')
  if (!input.riskLimitsValidated) reasons.push('RISK_LIMITS_NOT_VALIDATED')
  if (!input.profitabilityValidated) reasons.push('PROFITABILITY_NOT_VALIDATED')
  if (!input.slippageGasValidated) reasons.push('SLIPPAGE_GAS_NOT_VALIDATED')
  if (!input.executionPathEnabled) reasons.push('EXECUTION_PATH_DISABLED')
  if (input.killSwitchEnabled) reasons.push('KILL_SWITCH_ENABLED')
  if (gas * policy.maxGasMultiplier > policy.maxGasUsd) reasons.push('GAS_BUDGET_EXCEEDED')
  if (input.baseNetProfitUsd - enforcementCost < requiredNet) reasons.push('ENFORCEMENT_COST_ERODES_PROFIT_FLOOR')
  if (policy.bundleRequired && !policy.privateRelayPreferred) reasons.push('BUNDLE_POLICY_INCONSISTENT')

  return {
    decision: reasons.length === 0 ? 'ELIGIBLE_FOR_AUTHORIZATION' : 'BLOCKED',
    mode: reasons.length === 0 ? 'READY_FOR_AUTHORIZATION' : 'POLICY_ONLY',
    reasons,
    estimatedEnforcementCostUsd: enforcementCost,
    requiredNetProfitUsd: requiredNet,
    policy,
  }
}
