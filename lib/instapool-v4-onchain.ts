import {getAddress, isAddress, keccak256, type Address} from 'viem'
import {getInstapoolV4Deployment, INSTAPOOL_V4_SOURCE, type SupportedInstapoolChain} from './instapool-v4-config'

type JsonRpcResponse = {result?: string; error?: {message?: string}}

function rpcForChain(chainId: SupportedInstapoolChain): string | undefined {
  const rpcByChain: Record<SupportedInstapoolChain, string | undefined> = {
    1: process.env.ETH_RPC_URL,
    42161: process.env.ARB_RPC_URL,
    10: process.env.OPTIMISM_RPC_URL,
    137: process.env.POLYGON_RPC_URL,
    43114: process.env.AVALANCHE_RPC_URL,
  }
  return rpcByChain[chainId]
}

const hexCode = (value: string) => value === '0x' || value === '0x0' ? '' : value

async function ethGetCode(rpcUrl: string, address: Address): Promise<string> {
  const response = await fetch(rpcUrl, {
    method: 'POST',
    headers: {'content-type': 'application/json'},
    body: JSON.stringify({jsonrpc: '2.0', id: 1, method: 'eth_getCode', params: [address, 'latest']}),
    cache: 'no-store',
  })
  if (!response.ok) throw new Error(`RPC HTTP ${response.status}`)
  const json = await response.json() as JsonRpcResponse
  if (json.error) throw new Error(json.error.message || 'RPC error')
  if (typeof json.result !== 'string') throw new Error('INVALID_ETH_GETCODE_RESULT')
  return json.result
}

export type InstapoolV4OnchainVerification = {
  chainId: SupportedInstapoolChain
  connector: Address
  rpcConfigured: boolean
  hasBytecode: boolean
  bytecodeHash?: `0x${string}`
  expectedBytecodeHash?: `0x${string}`
  identityMatched: boolean
  authorized: false
  reason: string
  sourceCommit: string
}

/**
 * Verifies the configured connector against live chain state.
 * Production authorization remains impossible unless an independently
 * established expected runtime bytecode hash is configured and matches.
 */
export async function verifyInstapoolV4Bytecode(
  chainId: SupportedInstapoolChain,
  connector: string,
): Promise<InstapoolV4OnchainVerification> {
  const rpcUrl = rpcForChain(chainId)
  const normalized = isAddress(connector) ? getAddress(connector) : undefined
  if (!normalized) {
    return {chainId, connector: connector as Address, rpcConfigured: Boolean(rpcUrl), hasBytecode: false, identityMatched: false, authorized: false, reason: 'INVALID_CONNECTOR_ADDRESS', sourceCommit: INSTAPOOL_V4_SOURCE.commit}
  }
  if (!rpcUrl) {
    return {chainId, connector: normalized, rpcConfigured: false, hasBytecode: false, identityMatched: false, authorized: false, reason: 'CHAIN_RPC_NOT_CONFIGURED', sourceCommit: INSTAPOOL_V4_SOURCE.commit}
  }

  const code = hexCode(await ethGetCode(rpcUrl, normalized))
  if (!code) {
    return {chainId, connector: normalized, rpcConfigured: true, hasBytecode: false, identityMatched: false, authorized: false, reason: 'CONNECTOR_HAS_NO_DEPLOYED_BYTECODE', sourceCommit: INSTAPOOL_V4_SOURCE.commit}
  }

  const bytecodeHash = keccak256(code as `0x${string}`)
  const expectedBytecodeHash = getInstapoolV4Deployment(chainId).expectedBytecodeHash
  const identityMatched = expectedBytecodeHash !== undefined && bytecodeHash.toLowerCase() === expectedBytecodeHash.toLowerCase()

  return {
    chainId,
    connector: normalized,
    rpcConfigured: true,
    hasBytecode: true,
    bytecodeHash,
    expectedBytecodeHash,
    identityMatched,
    authorized: false,
    reason: expectedBytecodeHash === undefined
      ? 'BYTECODE_PRESENT_EXPECTED_HASH_NOT_CONFIGURED'
      : identityMatched
        ? 'BYTECODE_IDENTITY_MATCH_AUTHORIZATION_PENDING'
        : 'BYTECODE_IDENTITY_MISMATCH',
    sourceCommit: INSTAPOOL_V4_SOURCE.commit,
  }
}

export function assertInstapoolV4BytecodePresent(result: InstapoolV4OnchainVerification): void {
  if (!result.rpcConfigured) throw new Error('CHAIN_RPC_NOT_CONFIGURED')
  if (!result.hasBytecode) throw new Error('CONNECTOR_HAS_NO_DEPLOYED_BYTECODE')
}

export function assertInstapoolV4IdentityMatched(result: InstapoolV4OnchainVerification): void {
  assertInstapoolV4BytecodePresent(result)
  if (!result.expectedBytecodeHash) throw new Error('EXPECTED_BYTECODE_HASH_NOT_CONFIGURED')
  if (!result.identityMatched) throw new Error('BYTECODE_IDENTITY_MISMATCH')
}
