import {strict as assert} from 'node:assert'
import {test} from 'node:test'
import {runInstadappPreExecution} from './instadapp-pre-execution'

const account='0x0000000000000000000000000000000000000001' as `0x${string}`
const target='0x0000000000000000000000000000000000000002' as `0x${string}`
const origin='0x0000000000000000000000000000000000000003' as `0x${string}`

const plan={
  chainId:1,
  loanAsset:'0x0000000000000000000000000000000000000010',
  loanAmountUsd:100,
  flashLoanFeeUsd:0.1,
  swapCostUsd:0,
  gasUsd:1,
  slippageUsd:0.5,
  grossProfitUsd:10,
  netProfitUsd:8.4,
  minNetProfitUsd:5,
  safetyReserveUsd:2,
}

test('Instadapp pre-execution remains fail-closed when RPC is missing',async()=>{
  const result=await runInstadappPreExecution({
    plan,
    smartAccount:account,
    targets:[target],
    datas:['0x1234'],
    origin,
    rpcUrl:'',
    finalTokenAmount:101n,
    loanAmountToken:100n,
    feeAmountToken:1n,
  })

  assert.equal(result.authorized,false)
  assert.equal(result.instadapp.simulation.ok,false)
  assert.match(result.reasons.join('|'),/SIMULATION_FAILED:RPC_NOT_CONFIGURED/)
})

test('Instadapp pre-execution rejects invalid cast before RPC simulation',async()=>{
  await assert.rejects(
    () => runInstadappPreExecution({
      plan,
      smartAccount:account,
      targets:[],
      datas:[],
      origin,
      rpcUrl:'',
      finalTokenAmount:101n,
      loanAmountToken:100n,
      feeAmountToken:1n,
    }),
    /MISSING_CAST_TARGETS/,
  )
})
