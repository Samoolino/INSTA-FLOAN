import {strict as assert} from 'node:assert'
import {test} from 'node:test'
import {readTokenBalance} from './token-balance'

const token='0x0000000000000000000000000000000000000001' as `0x${string}`
const account='0x0000000000000000000000000000000000000002' as `0x${string}`

const originalFetch=globalThis.fetch

test.afterEach(()=>{globalThis.fetch=originalFetch})

test('pinned ERC20 balance observation encodes balanceOf and block tag',async()=>{
 globalThis.fetch=async(_input,_init)=>new Response(JSON.stringify({result:'0x2a'}),{status:200})
 const balance=await readTokenBalance({rpcUrl:'https://example.invalid',token,account,blockNumber:123n})
 assert.equal(balance,42n)
})

test('balance observation fails closed without RPC',async()=>{
 await assert.rejects(
  readTokenBalance({rpcUrl:'',token,account,blockNumber:1n}),
  /RPC_NOT_CONFIGURED/,
 )
})

test('balance observation rejects invalid block number',async()=>{
 await assert.rejects(
  readTokenBalance({rpcUrl:'https://example.invalid',token,account,blockNumber:-1n}),
  /INVALID_BLOCK_NUMBER/,
 )
})

test('balance observation rejects malformed RPC result',async()=>{
 globalThis.fetch=async(_input,_init)=>new Response(JSON.stringify({result:'not-hex'}),{status:200})
 await assert.rejects(
  readTokenBalance({rpcUrl:'https://example.invalid',token,account,blockNumber:1n}),
  /RPC_INVALID_BALANCE_RESULT/,
 )
})
