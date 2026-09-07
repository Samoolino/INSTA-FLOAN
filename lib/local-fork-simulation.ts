import {type Address, type Hex} from 'viem'
import {readTokenBalance} from './token-balance'

export type LocalForkSimulationRequest = {
  rpcUrl: string
  from: Address
  to: Address
  data: Hex
  token: Address
  account: Address
  value?: bigint
}

export type LocalForkSimulationResult = {
  blockNumber: bigint
  preBalance: bigint
  postBalance: bigint
  transactionHash: Hex
}

function assertLocalRpc(rpcUrl: string) {
  let url: URL
  try { url = new URL(rpcUrl) } catch { throw new Error('INVALID_LOCAL_FORK_RPC_URL') }
  const host = url.hostname.toLowerCase()
  if (host !== '127.0.0.1' && host !== 'localhost' && host !== '::1') {
    throw new Error('LOCAL_FORK_RPC_REQUIRED')
  }
}

async function rpc(rpcUrl: string, method: string, params: unknown[]) {
  const response = await fetch(rpcUrl, {
    method: 'POST',
    headers: {'content-type': 'application/json'},
    body: JSON.stringify({jsonrpc: '2.0', id: 1, method, params}),
    cache: 'no-store',
  })
  if (!response.ok) throw new Error(`RPC_HTTP_${response.status}`)
  const json = await response.json() as {result?: string | null; error?: {message?: string}}
  if (json.error) throw new Error(json.error.message || 'RPC_ERROR')
  if (json.result === undefined || json.result === null) throw new Error('RPC_NO_RESULT')
  return json.result
}

/**
 * Executes the exact route on a loopback Anvil-style fork and observes the
 * resulting ERC-20 balance. This deliberately does not infer repayment from
 * the post-transaction balance: a successful atomic route may already have
 * repaid the loan before the final balance is observed. A future instrumented
 * route can expose a pre-payback balance for validateSimulatedRepayment.
 */
export async function simulateOnLocalFork(request: LocalForkSimulationRequest): Promise<LocalForkSimulationResult> {
  assertLocalRpc(request.rpcUrl)

  const blockNumber = BigInt(await rpc(request.rpcUrl, 'eth_blockNumber', []))
  const preBalance = await readTokenBalance({
    rpcUrl: request.rpcUrl,
    token: request.token,
    account: request.account,
    blockNumber,
  })

  const snapshot = await rpc(request.rpcUrl, 'evm_snapshot', [])
  try {
    const txHash = await rpc(request.rpcUrl, 'eth_sendTransaction', [{
      from: request.from,
      to: request.to,
      data: request.data,
      ...(request.value !== undefined ? {value: `0x${request.value.toString(16)}`} : {}),
    }]) as Hex

    const receipt = await rpc(request.rpcUrl, 'eth_getTransactionReceipt', [txHash])
    if (!receipt) throw new Error('TRANSACTION_RECEIPT_UNAVAILABLE')

    const postBlock = BigInt(await rpc(request.rpcUrl, 'eth_blockNumber', []))
    const postBalance = await readTokenBalance({
      rpcUrl: request.rpcUrl,
      token: request.token,
      account: request.account,
      blockNumber: postBlock,
    })

    return {blockNumber, preBalance, postBalance, transactionHash: txHash}
  } finally {
    await rpc(request.rpcUrl, 'evm_revert', [snapshot])
  }
}
