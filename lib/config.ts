const bool = (value: string | undefined, fallback = false) => {
  if (value === undefined || value === '') return fallback
  return value.toLowerCase() === 'true'
}

const positiveNumber = (value: string | undefined, fallback: number) => {
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

export const runtimeConfig = {
  liveExecution: bool(process.env.LIVE_EXECUTION, false),
  targetProfitUsd: positiveNumber(process.env.TARGET_PROFIT_USD, 100),
  minNetProfitUsd: positiveNumber(process.env.MIN_NET_PROFIT_USD, 5),
  safetyReserveUsd: positiveNumber(process.env.SAFETY_RESERVE_USD, 2),
  maxPathsPerCycle: Math.max(1, Math.floor(positiveNumber(process.env.MAX_PATHS_PER_CYCLE, 25))),
  maxCycles: Math.max(1, Math.floor(positiveNumber(process.env.MAX_CYCLES, 100))),
}

export function assertExecutionDisabled() {
  if (runtimeConfig.liveExecution) {
    throw new Error('LIVE_EXECUTION must remain false until production execution gates are explicitly validated')
  }
}

export function getPublicRuntimeStatus() {
  return {
    liveExecution: runtimeConfig.liveExecution,
    mode: runtimeConfig.liveExecution ? 'LIVE_BLOCKED_PENDING_VALIDATION' : 'SIMULATION_ONLY',
  }
}
