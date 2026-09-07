import {strict as assert} from 'node:assert'
import {test} from 'node:test'
import {validateExecutionPlan, type ExecutionPlan} from './execution-plan'

const base: ExecutionPlan = {
  chainId: 1, loanAsset: 'USDC', loanAmountUsd: 10_000,
  flashLoanFeeUsd: 9, swapCostUsd: 3, gasUsd: 4, slippageUsd: 2,
  grossProfitUsd: 30, netProfitUsd: 12, minNetProfitUsd: 5, safetyReserveUsd: 2,
}

test('accepts a fully modeled profitable plan', () => {
  const result = validateExecutionPlan(base)
  assert.equal(result.executable, true)
  assert.equal(result.repaymentUsd, 10009)
})

test('rejects a plan whose net profit does not reconcile', () => {
  const result = validateExecutionPlan({...base, netProfitUsd: 50})
  assert.equal(result.executable, false)
  assert.ok(result.reasons.includes('NET_PROFIT_MISMATCH'))
})

test('rejects a plan below the minimum and reserve', () => {
  const result = validateExecutionPlan({...base, grossProfitUsd: 10, netProfitUsd: -8})
  assert.equal(result.executable, false)
  assert.ok(result.reasons.includes('BELOW_MIN_NET_PROFIT'))
  assert.ok(result.reasons.includes('NON_POSITIVE_NET_PROFIT'))
})
