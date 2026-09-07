import {getAddress, isAddress, type Address} from 'viem'

export const INSTAPOOL_V4_SOURCE = {
  repository: 'Instadapp/dsa-connectors',
  commit: 'a8e806796064f8012c0896b641e93c14b0c242e1',
  contract: 'ConnectV2InstaPoolV4',
  name: 'Instapool-v4',
  function: 'flashBorrowAndCast(address,uint256,uint256,bytes,bytes)',
} as const

export type SupportedInstapoolChain = 1 | 42161 | 10 | 137 | 43114

export type InstapoolV4Deployment = {
  chainId: SupportedInstapoolChain
  connector?: Address
  expectedBytecodeHash?: `0x${string}`
  verified: boolean
  sourceCommit: string
}

const ENV_BY_CHAIN: Record<SupportedInstapoolChain, string> = {
  1: 'INSTAPOOL_V4_CONNECTOR_ETHEREUM',
  42161: 'INSTAPOOL_V4_CONNECTOR_ARBITRUM',
  10: 'INSTAPOOL_V4_CONNECTOR_OPTIMISM',
  137: 'INSTAPOOL_V4_CONNECTOR_POLYGON',
  43114: 'INSTAPOOL_V4_CONNECTOR_AVALANCHE',
}

const VERIFIED_BY_CHAIN: Record<SupportedInstapoolChain, string> = {
  1: 'INSTAPOOL_V4_VERIFIED_ETHEREUM',
  42161: 'INSTAPOOL_V4_VERIFIED_ARBITRUM',
  10: 'INSTAPOOL_V4_VERIFIED_OPTIMISM',
  137: 'INSTAPOOL_V4_VERIFIED_POLYGON',
  43114: 'INSTAPOOL_V4_VERIFIED_AVALANCHE',
}

const BYTECODE_HASH_BY_CHAIN: Record<SupportedInstapoolChain, string> = {
  1: 'INSTAPOOL_V4_BYTECODE_HASH_ETHEREUM',
  42161: 'INSTAPOOL_V4_BYTECODE_HASH_ARBITRUM',
  10: 'INSTAPOOL_V4_BYTECODE_HASH_OPTIMISM',
  137: 'INSTAPOOL_V4_BYTECODE_HASH_POLYGON',
  43114: 'INSTAPOOL_V4_BYTECODE_HASH_AVALANCHE',
}

function parseConfiguredAddress(value: string | undefined): Address | undefined {
  if (!value || !isAddress(value)) return undefined
  return getAddress(value)
}

function parseConfiguredHash(value: string | undefined): `0x${string}` | undefined {
  if (!value || !/^0x[0-9a-fA-F]{64}$/.test(value)) return undefined
  return value.toLowerCase() as `0x${string}`
}

function isSupportedChain(chainId: number): chainId is SupportedInstapoolChain {
  return chainId === 1 || chainId === 42161 || chainId === 10 || chainId === 137 || chainId === 43114
}

function envTrue(name: string): boolean {
  return process.env[name]?.toLowerCase() === 'true'
}

export function getInstapoolV4Deployment(chainId: SupportedInstapoolChain): InstapoolV4Deployment {
  const connector = parseConfiguredAddress(process.env[ENV_BY_CHAIN[chainId]])
  return {
    chainId,
    connector,
    expectedBytecodeHash: parseConfiguredHash(process.env[BYTECODE_HASH_BY_CHAIN[chainId]]),
    verified: connector !== undefined && envTrue(VERIFIED_BY_CHAIN[chainId]),
    sourceCommit: INSTAPOOL_V4_SOURCE.commit,
  }
}

export function assertInstapoolV4Deployment(chainId: number): Address {
  if (!isSupportedChain(chainId)) throw new Error('INSTAPOOL_V4_UNSUPPORTED_CHAIN')
  const deployment = getInstapoolV4Deployment(chainId)
  if (!deployment.connector) throw new Error('INSTAPOOL_V4_CONNECTOR_NOT_CONFIGURED')
  if (!deployment.verified) throw new Error('INSTAPOOL_V4_DEPLOYMENT_NOT_VERIFIED')
  return deployment.connector
}

export function getInstapoolV4VerificationStatus() {
  return (Object.keys(ENV_BY_CHAIN).map(Number) as SupportedInstapoolChain[]).map(chainId => {
    const deployment = getInstapoolV4Deployment(chainId)
    return {
      chainId,
      connectorConfigured: Boolean(deployment.connector),
      expectedBytecodeHashConfigured: Boolean(deployment.expectedBytecodeHash),
      verified: deployment.verified,
      sourceCommit: deployment.sourceCommit,
    }
  })
}
