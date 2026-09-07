import {strict as assert} from 'node:assert'
import {test} from 'node:test'
import {simulateCall} from './route-simulation'

test('simulation fails closed without RPC',async()=>{
  const result=await simulateCall({rpcUrl:'',from:'0x0000000000000000000000000000000000000001',to:'0x0000000000000000000000000000000000000002',data:'0x'})
  assert.equal(result.ok,false)
  if(!result.ok) assert.equal(result.error,'RPC_NOT_CONFIGURED')
})

test('simulation rejects malformed RPC URL',async()=>{
  const result=await simulateCall({rpcUrl:'not-a-url',from:'0x0000000000000000000000000000000000000001',to:'0x0000000000000000000000000000000000000002',data:'0x'})
  assert.equal(result.ok,false)
})
