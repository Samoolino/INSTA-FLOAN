import {strict as assert} from 'node:assert'
import {test} from 'node:test'
import {assertProductionExecutionGate} from './production-gate'

const base = {
  liveExecution: true,
  controlledForkValidated: true,
  controlledForkValidationId: 'fork-validation-1',
  controlledForkAttestation: 'attested-controlled-fork-result',
  walletAuthorized: true,
  contractsVerified: true,
  atomicRepaymentVerified: true,
  simulationRequired: true,
  simulationPassed: true,
  riskGatesEnabled: true,
  netProfitGateEnabled: true,
  killSwitchEnabled: true,
}

test('allows production execution only after every gate passes', () => {
  assert.deepEqual(assertProductionExecutionGate(base), {allowed: true})
})

test('blocks live execution when controlled-fork validation is absent', () => {
  assert.throws(
    () => assertProductionExecutionGate({...base, controlledForkValidated: false}),
    /CONTROLLED_FORK_VALIDATION/,
  )
})

test('blocks live execution when the fork attestation is absent', () => {
  assert.throws(
    () => assertProductionExecutionGate({...base, controlledForkAttestation: ''}),
    /CONTROLLED_FORK_ATTESTATION/,
  )
})

test('blocks live execution when atomic repayment validation is absent', () => {
  assert.throws(
    () => assertProductionExecutionGate({...base, atomicRepaymentVerified: false}),
    /ATOMIC_REPAYMENT_VERIFICATION/,
  )
})

test('blocks live execution when risk controls or kill switch are absent', () => {
  assert.throws(
    () => assertProductionExecutionGate({...base, riskGatesEnabled: false}),
    /RISK_GATES/,
  )
  assert.throws(
    () => assertProductionExecutionGate({...base, killSwitchEnabled: false}),
    /OPERATOR_KILL_SWITCH/,
  )
})
