import {test} from 'node:test'
import assert from 'node:assert/strict'
import {simulateOnLocalFork} from './local-fork-simulation'

const request = {
  rpcUrl: 'https://example.invalid',
  from: '0x0000000000000000000000000000000000000001' as `0x${string}`,
  to: '0x0000000000000000000000000000000000000002' as `0x${string}`,
  data: '0x' as `0x${string}`,
  token: '0x0000000000000000000000000000000000000003' as `0x${string}`,
  account: '0x0000000000000000000000000000000000000001' as `0x${string}`,
  loanAmountToken: 100n,
  feeAmountToken: 1n,
}

test('local fork simulation rejects public RPC endpoints', async()=>{
  await assert.rejects(
    simulateOnLocalFork(request),
    /LOCAL_FORK_RPC_REQUIRED/,
  )
})

test('local fork simulation rejects malformed RPC URLs', async()=>{
  await assert.rejects(
    simulateOnLocalFork({...request, rpcUrl: 'not-a-url'}),
    /INVALID_LOCAL_FORK_RPC_URL/,
  )
})
