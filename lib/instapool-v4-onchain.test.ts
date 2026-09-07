import {strict as assert} from 'node:assert'
import {test} from 'node:test'
import {verifyInstapoolV4Bytecode, assertInstapoolV4BytecodePresent} from './instapool-v4-onchain'

const connector='0x0000000000000000000000000000000000000002'

test('Instapool v4 bytecode verifier fails closed when chain RPC is missing',async()=>{
  const previous=process.env.ETH_RPC_URL
  delete process.env.ETH_RPC_URL
  try {
    const result=await verifyInstapoolV4Bytecode(1,connector)
    assert.equal(result.rpcConfigured,false)
    assert.equal(result.hasBytecode,false)
    assert.equal(result.authorized,false)
    assert.equal(result.reason,'CHAIN_RPC_NOT_CONFIGURED')
  } finally {
    if(previous===undefined) delete process.env.ETH_RPC_URL
    else process.env.ETH_RPC_URL=previous
  }
})

test('Instapool v4 bytecode verifier rejects an invalid connector address',async()=>{
  const result=await verifyInstapoolV4Bytecode(1,'not-an-address')
  assert.equal(result.hasBytecode,false)
  assert.equal(result.authorized,false)
  assert.equal(result.reason,'INVALID_CONNECTOR_ADDRESS')
})

test('Instapool v4 bytecode assertion remains fail-closed without deployed code',()=>{
  assert.throws(()=>assertInstapoolV4BytecodePresent({
    chainId:1,
    connector:connector as `0x${string}`,
    rpcConfigured:true,
    hasBytecode:false,
    authorized:false,
    reason:'CONNECTOR_HAS_NO_DEPLOYED_BYTECODE',
    sourceCommit:'a8e806796064f8012c0896b641e93c14b0c242e1',
  }),/CONNECTOR_HAS_NO_DEPLOYED_BYTECODE/)
})

test('Instapool v4 bytecode presence never implies production authorization',()=>{
  const result={
    chainId:1 as const,
    connector:connector as `0x${string}`,
    rpcConfigured:true,
    hasBytecode:true,
    authorized:false as const,
    reason:'BYTECODE_PRESENT_AUTHORIZATION_PENDING',
    sourceCommit:'a8e806796064f8012c0896b641e93c14b0c242e1',
  }
  assert.doesNotThrow(()=>assertInstapoolV4BytecodePresent(result))
  assert.equal(result.authorized,false)
})
