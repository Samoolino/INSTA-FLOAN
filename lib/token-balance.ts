import {type Address, encodeFunctionData, parseAbi} from 'viem'

const erc20Abi = parseAbi([
  'function balanceOf(address account) view returns (uint256)',
])

export type TokenBalanceRequest = {
  rpcUrl: string
  token: Address
  account: Address
  blockNumber: bigint
}

/**
 * Reads an ERC-20 balance at an explicit block. This is observation only:
 * it never mutates chain state and never signs or broadcasts a transaction.
 */
export async function readTokenBalance(request: TokenBalanceRequest): Promise<bigint> {
  if (!request.rpcUrl) throw new Error('RPC_NOT_CONFIGURED')
  if (request.blockNumber < 0n) throw new Error('INVALID_BLOCK_NUMBER')

  const data = encodeFunctionData({
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [request.account],
  })

  const response = await fetch(request.rpcUrl, {
    method: 'POST',
    headers: {'content-type': 'application/json'},
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_call',
      params: [{to: request.token, data}, `0x${request.blockNumber.toString(16)}`],
    }),
    cache: 'no-store',
  })

  if (!response.ok) throw new Error(`RPC_HTTP_${response.status}`)
  const json = await response.json() as {result?: string; error?: {message?: string}}
  if (json.error) throw new Error(json.error.message || 'RPC_ERROR')
  if (!json.result || !/^0x[0-9a-fA-F]+$/.test(json.result)) throw new Error('RPC_INVALID_BALANCE_RESULT')
  return BigInt(json.result)
}
