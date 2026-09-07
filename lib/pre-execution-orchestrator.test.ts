import {strict as assert} from 'node:assert'
import {test} from 'node:test'
import {runPreExecutionOrchestration} from './pre-execution-orchestrator'

const plan = {
  chainId:1,
  loanAsset:'0x0000000000000000000000000000000000000001',
  loanAmountUsd:1000,
  flashLoanFeeUsd:1,
  swapCostUsd:0,
  gasUsd:2,
  slippageUsd:1,
  grossProfitUsd:20,
  netProfitUsd:16,
  minNetProfitUsd:5,
  safetyReserveUsd:2,
}

test('missing RPC is converted into a failed simulation and blocks authorization',async()=>{
 const result=await runPreExecutionOrchestration({
  plan,
  simulation:{rpcUrl:'',from:'0x0000000000000000000000000000000000000001',to:'0x0000000000000000000000000000000000000002',data:'0x'},
  finalTokenAmount:1010n,
  loanAmountToken:1000n,
  feeAmountToken:5n,
 })
 assert.equal(result.simulation.ok,false)
 assert.equal(result.authorized,false)
 assert.ok(result.reasons.includes('SIMULATION_FAILED:RPC_NOT_CONFIGURED'))
})
