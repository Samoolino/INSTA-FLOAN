import {test} from 'node:test'
import assert from 'node:assert/strict'
import {simulateOnLocalFork} from './local-fork-simulation'

const request = {
  rpcUrl: 'http://127.0.0.1:8545',
  from: '0x0000000000000000000000000000000000000001' as `0x${string}`,
  to: '0x0000000000000000000000000000000000000002' as `0x${string}`,
  data: '0x' as `0x${string}`,
  token: '0x0000000000000000000000000000000000000003' as `0x${string}`,
  account: '0x0000000000000000000000000000000000000001' as `0x${string}`,
}

test('local fork simulation rejects public RPC endpoints', async()=>{
  await assert.rejects(
    simulateOnLocalFork({...request, rpcUrl: 'https://example.invalid'}),
    /LOCAL_FORK_RPC_REQUIRED/,
  )
})

test('local fork simulation rejects malformed RPC URLs', async()=>{
  await assert.rejects(
    simulateOnLocalFork({...request, rpcUrl: 'not-a-url'}),
    /INVALID_LOCAL_FORK_RPC_URL/,
  )
})

test('local fork simulation requires a valid snapshot id', async()=>{
  const originalFetch = globalThis.fetch
  globalThis.fetch = async(_input, init) => {
    const body = JSON.parse(String(init?.body)) as {method: string}
    const result = body.method === 'eth_blockNumber' ? '0x10' : body.method === 'eth_call' ? '0x64' : ''
    return new Response(JSON.stringify({jsonrpc: '2.0', id: 1, result}), {status: 200})
  }
  try {
    await assert.rejects(simulateOnLocalFork(request), /INVALID_SNAPSHOT_ID/)
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('local fork simulation requires a successful receipt and reverts the snapshot', async()=>{
  const originalFetch = globalThis.fetch
  const methods: string[] = []
  globalThis.fetch = async(_input, init) => {
    const body = JSON.parse(String(init?.body)) as {method: string}
    methods.push(body.method)
    const results: Record<string, unknown> = {
      eth_blockNumber: '0x10',
      eth_call: '0x64',
      evm_snapshot: '0xabc',
      eth_sendTransaction: '0xtx',
      eth_getTransactionReceipt: {status: '0x1'},
      evm_revert: true,
    }
    return new Response(JSON.stringify({jsonrpc: '2.0', id: 1, result: results[body.method]}), {status: 200})
  }
  try {
    const result = await simulateOnLocalFork(request)
    assert.deepEqual(result, {
      blockNumber: 16n,
      preBalance: 100n,
      postBalance: 100n,
      transactionHash: '0xtx',
    })
    assert.deepEqual(methods, [
      'eth_blockNumber', 'eth_call', 'evm_snapshot', 'eth_sendTransaction',
      'eth_getTransactionReceipt', 'eth_blockNumber', 'eth_call', 'evm_revert',
    ])
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('local fork simulation rejects reverted transactions and still reverts the snapshot', async()=>{
  const originalFetch = globalThis.fetch
  const methods: string[] = []
  globalThis.fetch = async(_input, init) => {
    const body = JSON.parse(String(init?.body)) as {method: string}
    methods.push(body.method)
    const results: Record<string, unknown> = {
      eth_blockNumber: '0x10',
      eth_call: '0x64',
      evm_snapshot: '0xabc',
      eth_sendTransaction: '0xtx',
      eth_getTransactionReceipt: {status: '0x0'},
      evm_revert: true,
    }
    return new Response(JSON.stringify({jsonrpc: '2.0', id: 1, result: results[body.method]}), {status: 200})
  }
  try {
    await assert.rejects(simulateOnLocalFork(request), /SIMULATION_TRANSACTION_REVERTED/)
    assert.equal(methods.at(-1), 'evm_revert')
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('local fork simulation fails closed when snapshot revert fails', async()=>{
  const originalFetch = globalThis.fetch
  globalThis.fetch = async(_input, init) => {
    const body = JSON.parse(String(init?.body)) as {method: string}
    const results: Record<string, unknown> = {
      eth_blockNumber: '0x10',
      eth_call: '0x64',
      evm_snapshot: '0xabc',
      eth_sendTransaction: '0xtx',
      eth_getTransactionReceipt: {status: '0x1'},
      evm_revert: false,
    }
    return new Response(JSON.stringify({jsonrpc: '2.0', id: 1, result: results[body.method]}), {status: 200})
  }
  try {
    await assert.rejects(simulateOnLocalFork(request), /SNAPSHOT_REVERT_FAILED/)
  } finally {
    globalThis.fetch = originalFetch
  }
})
