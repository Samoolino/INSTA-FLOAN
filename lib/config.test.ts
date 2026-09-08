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
