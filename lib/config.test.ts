import {strict as assert} from 'node:assert'
import {test} from 'node:test'

test('production execution gate fails closed without controlled-fork validation', async () => {
  const names = [
    'LIVE_EXECUTION', 'CONTROLLED_FORK_VALIDATED', 'CONTROLLED_FORK_VALIDATION_ID',
    'ATOMIC_REPAYMENT_VALIDATED', 'PRODUCTION_WALLET_AUTHORIZED',
    'PRODUCTION_RISK_LIMITS_VALIDATED', 'PRODUCTION_PROFITABILITY_VALIDATED',
    'PRODUCTION_SLIPPAGE_GAS_VALIDATED', 'PRODUCTION_EXECUTION_PATH_ENABLED',
    'PRODUCTION_KILL_SWITCH_ENABLED',
  ] as const
  const previous = Object.fromEntries(names.map(name => [name, process.env[name]]))

  for (const name of names) delete process.env[name]
  process.env.LIVE_EXECUTION = 'true'

  try {
    const {assertLiveExecutionGate} = await import('./config')
    assert.throws(assertLiveExecutionGate, /CONTROLLED_FORK_VALIDATION_REQUIRED/)
  } finally {
    for (const name of names) {
      const value = previous[name]
      if (value === undefined) delete process.env[name]
      else process.env[name] = value
    }
  }
})

test('production execution gate requires every final control', async () => {
  const names = [
    'LIVE_EXECUTION', 'CONTROLLED_FORK_VALIDATED', 'CONTROLLED_FORK_VALIDATION_ID',
    'ATOMIC_REPAYMENT_VALIDATED', 'PRODUCTION_WALLET_AUTHORIZED',
    'PRODUCTION_RISK_LIMITS_VALIDATED', 'PRODUCTION_PROFITABILITY_VALIDATED',
    'PRODUCTION_SLIPPAGE_GAS_VALIDATED', 'PRODUCTION_EXECUTION_PATH_ENABLED',
    'PRODUCTION_KILL_SWITCH_ENABLED',
  ] as const
  const previous = Object.fromEntries(names.map(name => [name, process.env[name]]))

  const values: Record<string, string> = {
    LIVE_EXECUTION: 'true',
    CONTROLLED_FORK_VALIDATED: 'true',
    CONTROLLED_FORK_VALIDATION_ID: 'controlled-fork-run',
    ATOMIC_REPAYMENT_VALIDATED: 'true',
    PRODUCTION_WALLET_AUTHORIZED: 'true',
    PRODUCTION_RISK_LIMITS_VALIDATED: 'true',
    PRODUCTION_PROFITABILITY_VALIDATED: 'true',
    PRODUCTION_SLIPPAGE_GAS_VALIDATED: 'true',
    PRODUCTION_EXECUTION_PATH_ENABLED: 'true',
    PRODUCTION_KILL_SWITCH_ENABLED: 'false',
  }
  for (const name of names) process.env[name] = values[name]

  try {
    const {assertLiveExecutionGate} = await import(`./config?gate=${Date.now()}`)
    assert.doesNotThrow(assertLiveExecutionGate)
  } finally {
    for (const name of names) {
      const value = previous[name]
      if (value === undefined) delete process.env[name]
      else process.env[name] = value
    }
  }
})
