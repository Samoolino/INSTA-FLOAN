import {test} from 'node:test'
import assert from 'node:assert/strict'
import {validateAtomicRepaymentProof} from './atomic-repayment-proof'

const verifiedEnforcement = {
  repaymentEnforcementVerified: true,
}

test('successful atomic simulation proves repayment only with verified lender enforcement', () => {
  assert.deepEqual(validateAtomicRepaymentProof({
    simulationSucceeded: true,
    requiredRepaymentAmount: 101n,
    ...verifiedEnforcement,
  }), {verified: true})
})

test('unverified lender enforcement cannot prove repayment', () => {
  assert.deepEqual(validateAtomicRepaymentProof({
    simulationSucceeded: true,
    requiredRepaymentAmount: 101n,
    repaymentEnforcementVerified: false,
  }), {verified: false, reason: 'REPAYMENT_ENFORCEMENT_NOT_VERIFIED'})
})

test('failed atomic simulation cannot prove repayment', () => {
  assert.deepEqual(validateAtomicRepaymentProof({
    simulationSucceeded: false,
    requiredRepaymentAmount: 101n,
    ...verifiedEnforcement,
  }), {verified: false, reason: 'ATOMIC_SIMULATION_FAILED'})
})

test('invalid repayment requirement fails closed', () => {
  assert.throws(
    () => validateAtomicRepaymentProof({
      simulationSucceeded: true,
      requiredRepaymentAmount: 0n,
      ...verifiedEnforcement,
    }),
    /INVALID_REQUIRED_REPAYMENT_AMOUNT/,
  )
})
