import {strict as assert} from 'node:assert'
import {test} from 'node:test'
import {simulateInstadappCast} from './instadapp-simulation'

const account='0x0000000000000000000000000000000000000001' as `0x${string}`
const target='0x0000000000000000000000000000000000000002' as `0x${string}`
const origin='0x0000000000000000000000000000000000000003' as `0x${string}`

test('complete Instadapp cast simulation fails closed when RPC is missing',async()=>{
 const result=await simulateInstadappCast({
  smartAccount:account,
  targets:[target],
  datas:['0x1234'],
  origin,
  rpcUrl:'',
 })
 assert.equal(result.simulation.ok,false)
 if (!result.simulation.ok) assert.equal(result.simulation.error,'RPC_NOT_CONFIGURED')
})

test('complete Instadapp cast simulation validates cast inputs before RPC access',async()=>{
 await assert.rejects(
  simulateInstadappCast({
   smartAccount:account,
   targets:[target],
   datas:['0x'],
   origin,
   rpcUrl:'',
  }),
  /MISSING_CAST_DATA/,
 )
})
