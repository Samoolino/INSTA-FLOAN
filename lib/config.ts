const bool = (value: string | undefined, fallback = false) => {
  if (value === undefined || value === '') return fallback
  return value.toLowerCase() === 'true'
}

const positiveNumber = (value: string | undefined, fallback: number) => {
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

const nonEmpty = (value: string | undefined) => Boolean(value && value.trim())

export const runtimeConfig = {
  liveExecution: bool(process.env.LIVE_EXECUTION, false),
  targetProfitUsd: positiveNumber(process.env.TARGET_PROFIT_USD, 100),
  minNetProfitUsd: positiveNumber(process.env.MIN_NET_PROFIT_USD, 5),
  safetyReserveUsd: positiveNumber(process.env.SAFETY_RESERVE_USD, 2),
  maxPathsPerCycle: Math.max(1, Math.floor(positiveNumber(process.env.MAX_PATHS_PER_CYCLE, 25))),
  maxCycles: Math.max(1, Math.floor(positiveNumber(process.env.MAX_CYCLES, 100))),
  controlledForkValidated: bool(process.env.CONTROLLED_FORK_VALIDATED, false),
  controlledForkValidationId: process.env.CONTROLLED_FORK_VALIDATION_ID?.trim() || '',
  atomicRepaymentValidated: bool(process.env.ATOMIC_REPAYMENT_VALIDATED, false),
  walletAuthorized: bool(process.env.PRODUCTION_WALLET_AUTHORIZED, false),
  riskLimitsValidated: bool(process.env.PRODUCTION_RISK_LIMITS_VALIDATED, false),
  profitabilityValidated: bool(process.env.PRODUCTION_PROFITABILITY_VALIDATED, false),
  slippageGasValidated: bool(process.env.PRODUCTION_SLIPPAGE_GAS_VALIDATED, false),
  executionPathEnabled: bool(process.env.PRODUCTION_EXECUTION_PATH_ENABLED, false),
  killSwitchEnabled: bool(process.env.PRODUCTION_KILL_SWITCH_ENABLED, true),
}

export function assertExecutionDisabled() {
  if (runtimeConfig.liveExecution) {
    throw new Error('LIVE_EXECUTION must remain false until production execution gates are explicitly validated')
  }
}

/**
 * Final fail-closed boundary for any future real-money execution path.
 * A controlled-fork validation attestation is mandatory before live execution
 * can ever be enabled. The web client must never bypass this boundary.
 */
export function assertLiveExecutionGate() {
  if (!runtimeConfig.liveExecution) throw new Error('LIVE_EXECUTION_DISABLED')
  if (!runtimeConfig.controlledForkValidated || !runtimeConfig.controlledForkValidationId) {
    throw new Error('CONTROLLED_FORK_VALIDATION_REQUIRED')
  }
  if (!runtimeConfig.atomicRepaymentValidated) throw new Error('ATOMIC_REPAYMENT_VALIDATION_REQUIRED')
  if (!runtimeConfig.walletAuthorized) throw new Error('PRODUCTION_WALLET_AUTHORIZATION_REQUIRED')
  if (!runtimeConfig.riskLimitsValidated) throw new Error('PRODUCTION_RISK_LIMITS_REQUIRED')
  if (!runtimeConfig.profitabilityValidated) throw new Error('PRODUCTION_PROFITABILITY_VALIDATION_REQUIRED')
  if (!runtimeConfig.slippageGasValidated) throw new Error('PRODUCTION_SLIPPAGE_GAS_VALIDATION_REQUIRED')
  if (!runtimeConfig.executionPathEnabled) throw new Error('PRODUCTION_EXECUTION_PATH_DISABLED')
  if (runtimeConfig.killSwitchEnabled) throw new Error('PRODUCTION_KILL_SWITCH_ENABLED')
}

export function getPublicRuntimeStatus() {
  return {
    liveExecution: runtimeConfig.liveExecution,
    mode: runtimeConfig.liveExecution ? 'LIVE_BLOCKED_PENDING_VALIDATION' : 'SIMULATION_ONLY',
  }
}
