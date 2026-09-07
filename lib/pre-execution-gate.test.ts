import {strict as assert} from 'node:assert'
import {test} from 'node:test'
import {validatePreExecution} from './pre-execution-gate'

const plan = {
  chainId:1,
  loanAsset:'0x0000000000000000000000000000000000000001',
  loanAmountUsd:1000,
  flashLoanFeeUsd:1,
  swapCostUsd:0,
  protocolFeeUsd:0,
  gasUsd:2,
  slippageUsd:1,
  grossProfitUsd:20,
  netProfitUsd:16,
  minNetProfitUsd:5,
  safetyReserveUsd:2,
}

const verifiedAtomicRepaymentProof = {
  simulationSucceeded:true,
  requiredRepaymentAmount:1005n,
  repaymentEnforcementVerified:true,
}

test('all gates passing authorizes pre-execution only',()=>{
  const result=validatePreExecution({plan,finalTokenAmount:1010n,loanAmountToken:1000n,feeAmountToken:5n,simulationOk:true,atomicRepaymentProof:verifiedAtomicRepaymentProof})
  assert.equal(result.authorized,true)
  assert.deepEqual(result.reasons,[])
})

test('repayment failure blocks authorization',()=>{
  const result=validatePreExecution({plan,finalTokenAmount:1004n,loanAmountToken:1000n,feeAmountToken:5n,simulationOk:true,atomicRepaymentProof:verifiedAtomicRepaymentProof})
  assert.equal(result.authorized,false)
  assert.ok(result.reasons.includes('INSUFFICIENT_TOKEN_REPAYMENT'))
})

test('simulation failure blocks authorization',()=>{
  const result=validatePreExecution({plan,finalTokenAmount:1010n,loanAmountToken:1000n,feeAmountToken:5n,simulationOk:false,simulationError:'REVERT',atomicRepaymentProof:{...verifiedAtomicRepaymentProof,simulationSucceeded:false}})
  assert.equal(result.authorized,false)
  assert.ok(result.reasons.includes('SIMULATION_FAILED:REVERT'))
  assert.ok(result.reasons.includes('ATOMIC_SIMULATION_FAILED'))
})

test('profit gate failure blocks authorization',()=>{
  const result=validatePreExecution({plan:{...plan,netProfitUsd:3,minNetProfitUsd:5},finalTokenAmount:1010n,loanAmountToken:1000n,feeAmountToken:5n,simulationOk:true,atomicRepaymentProof:verifiedAtomicRepaymentProof})
  assert.equal(result.authorized,false)
  assert.ok(result.reasons.includes('BELOW_MIN_NET_PROFIT'))
})

test('missing protocol fee blocks authorization',()=>{
  const {protocolFeeUsd: _protocolFeeUsd, ...withoutFee} = plan
  const result=validatePreExecution({plan:withoutFee,finalTokenAmount:1010n,loanAmountToken:1000n,feeAmountToken:5n,simulationOk:true,atomicRepaymentProof:verifiedAtomicRepaymentProof})
  assert.equal(result.authorized,false)
  assert.ok(result.reasons.includes('PROTOCOL_FEE_NOT_CONFIGURED'))
})
