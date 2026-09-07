import {type Address, type Hex} from 'viem'
import {readTokenBalance} from './token-balance'
import {validateSimulatedRepayment, type SimulationRepaymentResult} from './simulation-repayment'

export type LocalForkSimulationRequest = {
  rpcUrl: string
  from: Address
  to: Address
  data: Hex
  token: Address
  account: Address
  loanAmountToken: bigint
  feeAmountToken: bigint
  value?: bigint
}

export type LocalForkSimulationResult = {
  blockNumber: bigint
  preBalance: bigint
  postBalance: bigint
  repayment: SimulationRepaymentResult
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
  const json = await response.json() as {result?: string; error?: {message?: string}}
  if (json.error) throw new Error(json.error.message || 'RPC_ERROR')
  if (json.result === undefined) throw new Error('RPC_NO_RESULT')
  return json.result
}

/**
 * Executes the exact route on a local Anvil-style fork and observes the ERC-20
 * balance after execution. This is deliberately restricted to loopback RPCs.
 * No public-chain transaction or signing path is permitted here.
 */
export async function simulateOnLocalFork(request: LocalForkSimulationRequest): Promise<LocalForkSimulationResult> {
  assertLocalRpc(request.rpcUrl)
  if (request.loanAmountToken <= 0n) throw new Error('INVALID_LOAN_AMOUNT')
  if (request.feeAmountToken < 0n) throw new Error('INVALID_FEE_AMOUNT')

  const blockHex = await rpc(request.rpcUrl, 'eth_blockNumber', [])
  const blockNumber = BigInt(blockHex)
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

    await rpc(request.rpcUrl, 'eth_getTransactionReceipt', [txHash])
    const postBlock = BigInt(await rpc(request.rpcUrl, 'eth_blockNumber', []))
    const postBalance = await readTokenBalance({
      rpcUrl: request.rpcUrl,
      token: request.token,
      account: request.account,
      blockNumber: postBlock,
    })
    const requiredRepaymentAmount = request.loanAmountToken + request.feeAmountToken
    const repayment = validateSimulatedRepayment(postBalance, requiredRepaymentAmount)

    return {blockNumber, preBalance, postBalance, repayment, transactionHash: txHash}
  } finally {
    await rpc(request.rpcUrl, 'evm_revert', [snapshot])
  }
}
