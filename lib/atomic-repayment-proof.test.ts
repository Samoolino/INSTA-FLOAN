import {test} from 'node:test'
import assert from 'node:assert/strict'
import {validateAtomicRepaymentProof} from './atomic-repayment-proof'

test('successful atomic simulation proves repayment outcome when lender enforces atomic repayment', () => {
  assert.deepEqual(validateAtomicRepaymentProof({
    simulationSucceeded: true,
    requiredRepaymentAmount: 101n,
  }), {verified: true})
})

test('failed atomic simulation cannot prove repayment', () => {
  assert.deepEqual(validateAtomicRepaymentProof({
    simulationSucceeded: false,
    requiredRepaymentAmount: 101n,
  }), {verified: false, reason: 'ATOMIC_SIMULATION_FAILED'})
})

test('invalid repayment requirement fails closed', () => {
  assert.throws(
    () => validateAtomicRepaymentProof({simulationSucceeded: true, requiredRepaymentAmount: 0n}),
    /INVALID_REQUIRED_REPAYMENT_AMOUNT/,
  )
})
