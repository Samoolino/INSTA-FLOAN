import {strict as assert} from 'node:assert'
import {test} from 'node:test'
import {checkChain} from './chain-health'

test('missing RPC is fail-closed', async()=>{
  const result=await checkChain({name:'ethereum',chainId:1,rpcUrl:''})
  assert.equal(result.ok,false)
  assert.equal(result.error,'RPC_NOT_CONFIGURED')
})

test('malformed RPC URL is fail-closed', async()=>{
  const result=await checkChain({name:'ethereum',chainId:1,rpcUrl:'not-a-url'})
  assert.equal(result.ok,false)
})
