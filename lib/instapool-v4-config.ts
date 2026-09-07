import {getAddress, isAddress, type Address} from 'viem'

/**
 * Instadapp dsa-connectors source verification record.
 *
 * The connector ABI/signature is verified from the official source, but this
 * registry intentionally does NOT invent deployment addresses. A deployment
 * becomes eligible only when an operator supplies the chain-specific address
 * and explicitly verifies it against the intended Instadapp deployment.
 */
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

function parseConfiguredAddress(value: string | undefined): Address | undefined {
  if (!value || !isAddress(value)) return undefined
  return getAddress(value)
}

export function getInstapoolV4Deployment(chainId: number): InstapoolV4Deployment {
  if (!(chainId in ENV_BY_CHAIN)) {
    return {
      chainId: chainId as SupportedInstapoolChain,
      verified: false,
      sourceCommit: INSTAPOOL_V4_SOURCE.commit,
    }
  }

  const envName = ENV_BY_CHAIN[chainId as SupportedInstapoolChain]
  const connector = parseConfiguredAddress(process.env[envName])

  return {
    chainId: chainId as SupportedInstapoolChain,
    connector,
    verified: connector !== undefined && process.env.INSTAPOOL_V4_DEPLOYMENT_VERIFIED === 'true',
    sourceCommit: INSTAPOOL_V4_SOURCE.commit,
  }
}

export function assertInstapoolV4Deployment(chainId: number): Address {
  const deployment = getInstapoolV4Deployment(chainId)
  if (!deployment.connector) throw new Error('INSTAPOOL_V4_CONNECTOR_NOT_CONFIGURED')
  if (!deployment.verified) throw new Error('INSTAPOOL_V4_DEPLOYMENT_NOT_VERIFIED')
  return deployment.connector
}

export function getInstapoolV4VerificationStatus() {
  return Object.keys(ENV_BY_CHAIN).map(Number).map(chainId => {
    const deployment = getInstapoolV4Deployment(chainId)
    return {
      chainId,
      connectorConfigured: Boolean(deployment.connector),
      verified: deployment.verified,
      sourceCommit: deployment.sourceCommit,
    }
  })
}
