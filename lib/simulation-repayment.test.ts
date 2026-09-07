import {strict as assert} from 'node:assert'
import {test} from 'node:test'
import {validateSimulatedRepayment} from './simulation-repayment'

test('actual simulated output must cover exact repayment', () => {
  const result = validateSimulatedRepayment(1_010_000n, 1_000_000n)
  assert.equal(result.sufficient, true)
  assert.equal(result.surplusAmount, 10_000n)
})

test('simulation repayment fails closed below required amount', () => {
  const result = validateSimulatedRepayment(999_999n, 1_000_000n)
  assert.equal(result.sufficient, false)
  assert.equal(result.surplusAmount, 0n)
})

test('invalid repayment requirement is rejected', () => {
  assert.throws(() => validateSimulatedRepayment(1n, 0n), /INVALID_REQUIRED_REPAYMENT_AMOUNT/)
})

test('negative simulated output is rejected', () => {
  assert.throws(() => validateSimulatedRepayment(-1n, 1n), /INVALID_ACTUAL_FINAL_AMOUNT/)
})
