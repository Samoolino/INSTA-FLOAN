import {strict as assert} from 'node:assert'
import {test} from 'node:test'
import {verifyInstapoolV4Bytecode, assertInstapoolV4BytecodePresent, assertInstapoolV4IdentityMatched} from './instapool-v4-onchain'

const connector='0x0000000000000000000000000000000000000002'

function mockRpc(code: string) {
  const previous=globalThis.fetch
  globalThis.fetch=async()=>new Response(JSON.stringify({jsonrpc:'2.0',id:1,result:code}),{status:200,headers:{'content-type':'application/json'}})
  return ()=>{ globalThis.fetch=previous }
}

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
    identityMatched:false,
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
    identityMatched:false,
    authorized:false as const,
    reason:'BYTECODE_PRESENT_EXPECTED_HASH_NOT_CONFIGURED',
    sourceCommit:'a8e806796064f8012c0896b641e93c14b0c242e1',
  }
  assert.doesNotThrow(()=>assertInstapoolV4BytecodePresent(result))
  assert.equal(result.authorized,false)
})

test('Instapool v4 identity assertion rejects a missing expected hash',()=>{
  assert.throws(()=>assertInstapoolV4IdentityMatched({
    chainId:1,
    connector:connector as `0x${string}`,
    rpcConfigured:true,
    hasBytecode:true,
    identityMatched:false,
    authorized:false,
    reason:'BYTECODE_PRESENT_EXPECTED_HASH_NOT_CONFIGURED',
    sourceCommit:'a8e806796064f8012c0896b641e93c14b0c242e1',
  }),/EXPECTED_BYTECODE_HASH_NOT_CONFIGURED/)
})

test('Instapool v4 identity assertion rejects a hash mismatch',()=>{
  assert.throws(()=>assertInstapoolV4IdentityMatched({
    chainId:1,
    connector:connector as `0x${string}`,
    rpcConfigured:true,
    hasBytecode:true,
    bytecodeHash:'0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    expectedBytecodeHash:'0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    identityMatched:false,
    authorized:false,
    reason:'BYTECODE_IDENTITY_MISMATCH',
    sourceCommit:'a8e806796064f8012c0896b641e93c14b0c242e1',
  }),/BYTECODE_IDENTITY_MISMATCH/)
})

test('Instapool v4 identity verification computes and matches runtime bytecode hash',async()=>{
  const code='0x6001600055'
  const restore=mockRpc(code)
  const previousRpc=process.env.ETH_RPC_URL
  const previousHash=process.env.INSTAPOOL_V4_BYTECODE_HASH_ETHEREUM
  const {keccak256}=await import('viem')
  process.env.ETH_RPC_URL='https://rpc.invalid'
  process.env.INSTAPOOL_V4_BYTECODE_HASH_ETHEREUM=keccak256(code as `0x${string}`)
  try {
    const result=await verifyInstapoolV4Bytecode(1,connector)
    assert.equal(result.hasBytecode,true)
    assert.equal(result.identityMatched,true)
    assert.equal(result.reason,'BYTECODE_IDENTITY_MATCH_AUTHORIZATION_PENDING')
    assert.equal(result.authorized,false)
    assert.doesNotThrow(()=>assertInstapoolV4IdentityMatched(result))
  } finally {
    restore()
    if(previousRpc===undefined) delete process.env.ETH_RPC_URL
    else process.env.ETH_RPC_URL=previousRpc
    if(previousHash===undefined) delete process.env.INSTAPOOL_V4_BYTECODE_HASH_ETHEREUM
    else process.env.INSTAPOOL_V4_BYTECODE_HASH_ETHEREUM=previousHash
  }
})
