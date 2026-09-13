export type BridgeConnectorStatus = {
  name: string
  kind: 'CEX' | 'DEX'
  configured: boolean
  credentialsConfigured: boolean
  networkScope: string[]
  executionEnabled: boolean
}

function list(value: string | undefined): string[] {
  return (value || '')
    .split(',')
    .map(v => v.trim())
    .filter(Boolean)
}

export function getHummingbotBridgeStatus() {
  const cex = list(process.env.HUMMINGBOT_CEX_CONNECTORS)
  const dex = list(process.env.HUMMINGBOT_DEX_CONNECTORS)
  const configuredNetworks = list(process.env.HUMMINGBOT_NETWORKS)
  const bridgeEnabled = process.env.HUMMINGBOT_BRIDGE_ENABLED === 'true'
  const liveTradingEnabled = process.env.HUMMINGBOT_LIVE_TRADING_ENABLED === 'true'
  const executionAuthorized = process.env.HUMMINGBOT_EXECUTION_AUTHORIZED === 'true'

  const networks: Array<[string, string | undefined]> = [
    ['ethereum', process.env.ETH_RPC_URL],
    ['arbitrum', process.env.ARB_RPC_URL],
    ['base', process.env.BASE_RPC_URL],
    ['bsc', process.env.BSC_RPC_URL],
    ['optimism', process.env.OPTIMISM_RPC_URL],
    ['polygon', process.env.POLYGON_RPC_URL],
    ['avalanche', process.env.AVALANCHE_RPC_URL],
  ]

  const activeNetworks = [...new Set([
    ...networks.filter(([, rpc]) => Boolean(rpc)).map(([name]) => name),
    ...configuredNetworks,
  ])]

  const connectors: BridgeConnectorStatus[] = [
    ...cex.map(name => ({
      name,
      kind: 'CEX' as const,
      configured: true,
      // Credential values are deliberately never returned to the browser.
      credentialsConfigured: false,
      networkScope: activeNetworks,
      executionEnabled: bridgeEnabled && liveTradingEnabled && executionAuthorized,
    })),
    ...dex.map(name => ({
      name,
      kind: 'DEX' as const,
      configured: true,
      credentialsConfigured: Boolean(process.env.HUMMINGBOT_GATEWAY_PASSPHRASE),
      networkScope: activeNetworks,
      executionEnabled: bridgeEnabled && liveTradingEnabled && executionAuthorized,
    })),
  ]

  return {
    enabled: bridgeEnabled,
    liveTradingEnabled,
    executionAuthorized,
    apiConfigured: Boolean(process.env.HUMMINGBOT_API_URL),
    gatewayConfigured: Boolean(process.env.HUMMINGBOT_GATEWAY_URL),
    activeNetworks,
    connectors,
    policy: {
      secretsNeverReturned: true,
      withdrawalsDisabledByArchitecture: true,
      readOnlyUntilExplicitAuthorization: true,
      controlledForkRequired: process.env.REQUIRE_CONTROLLED_FORK_ATTESTATION !== 'false',
    },
  }
}
