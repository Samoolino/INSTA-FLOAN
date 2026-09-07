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
  const json = await response.json() as {result?: unknown; error?: {message?: string}}
  if (json.error) throw new Error(json.error.message || 'RPC_ERROR')
  if (json.result === undefined || json.result === null) throw new Error('RPC_NO_RESULT')
  return json.result
}

function requireSnapshotId(value: unknown): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error('INVALID_SNAPSHOT_ID')
  }
  return value
}

function requireRevertSuccess(value: unknown) {
  if (value !== true) throw new Error('SNAPSHOT_REVERT_FAILED')
}

/**
 * Executes the exact route on a loopback Anvil-style fork and observes the
 * resulting ERC-20 balance. This deliberately does not infer repayment from
 * the post-transaction balance: a successful atomic route may already have
 * repaid the loan before the final balance is observed.
 *
 * This function is strictly for local fork simulation. It requires a valid
 * snapshot and a confirmed successful snapshot revert so simulated state
 * cannot silently persist after the test.
 */
export async function simulateOnLocalFork(request: LocalForkSimulationRequest): Promise<LocalForkSimulationResult> {
  assertLocalRpc(request.rpcUrl)

  const blockNumber = BigInt(await rpc(request.rpcUrl, 'eth_blockNumber', []) as string)
  const preBalance = await readTokenBalance({
    rpcUrl: request.rpcUrl,
    token: request.token,
    account: request.account,
    blockNumber,
  })

  const snapshot = requireSnapshotId(await rpc(request.rpcUrl, 'evm_snapshot', []))
  let simulationError: unknown
  try {
    const txHash = await rpc(request.rpcUrl, 'eth_sendTransaction', [{
      from: request.from,
      to: request.to,
      data: request.data,
      ...(request.value !== undefined ? {value: `0x${request.value.toString(16)}`} : {}),
    }]) as Hex

    const receipt = await rpc(request.rpcUrl, 'eth_getTransactionReceipt', [txHash]) as {status?: string}
    if (!receipt.status) throw new Error('TRANSACTION_RECEIPT_UNAVAILABLE')
    if (receipt.status !== '0x1') throw new Error('SIMULATION_TRANSACTION_REVERTED')

    const postBlock = BigInt(await rpc(request.rpcUrl, 'eth_blockNumber', []) as string)
    const postBalance = await readTokenBalance({
      rpcUrl: request.rpcUrl,
      token: request.token,
      account: request.account,
      blockNumber: postBlock,
    })

    return {blockNumber, preBalance, postBalance, transactionHash: txHash}
  } catch (error) {
    simulationError = error
    throw error
  } finally {
    try {
      requireRevertSuccess(await rpc(request.rpcUrl, 'evm_revert', [snapshot]))
    } catch (revertError) {
      if (simulationError !== undefined) {
        throw new Error(
          `SIMULATION_AND_SNAPSHOT_REVERT_FAILED:${simulationError instanceof Error ? simulationError.message : String(simulationError)}:${revertError instanceof Error ? revertError.message : String(revertError)}`,
        )
      }
      throw revertError
    }
  }
}
