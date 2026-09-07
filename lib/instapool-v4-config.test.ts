import {strict as assert} from 'node:assert'
import {test} from 'node:test'
import {getInstapoolV4Deployment, assertInstapoolV4Deployment, INSTAPOOL_V4_SOURCE} from './instapool-v4-config'

test('Instapool v4 registry records the verified upstream source', () => {
  assert.equal(INSTAPOOL_V4_SOURCE.repository, 'Instadapp/dsa-connectors')
  assert.equal(INSTAPOOL_V4_SOURCE.contract, 'ConnectV2InstaPoolV4')
  assert.equal(INSTAPOOL_V4_SOURCE.function, 'flashBorrowAndCast(address,uint256,uint256,bytes,bytes)')
})

test('unconfigured deployment remains fail-closed', () => {
  const deployment = getInstapoolV4Deployment(1)
  assert.equal(deployment.connector, undefined)
  assert.equal(deployment.verified, false)
  assert.throws(() => assertInstapoolV4Deployment(1), /INSTAPOOL_V4_CONNECTOR_NOT_CONFIGURED|INSTAPOOL_V4_DEPLOYMENT_NOT_VERIFIED/)
})

test('unsupported chain remains fail-closed', () => {
  assert.throws(() => assertInstapoolV4Deployment(56), /INSTAPOOL_V4_UNSUPPORTED_CHAIN/)
})

test('verification is chain-specific rather than globally shared', () => {
  const originalAddress = process.env.INSTAPOOL_V4_CONNECTOR_ETHEREUM
  const originalEth = process.env.INSTAPOOL_V4_VERIFIED_ETHEREUM
  const originalArb = process.env.INSTAPOOL_V4_VERIFIED_ARBITRUM
  process.env.INSTAPOOL_V4_CONNECTOR_ETHEREUM = '0x0000000000000000000000000000000000000001'
  process.env.INSTAPOOL_V4_VERIFIED_ETHEREUM = 'true'
  process.env.INSTAPOOL_V4_VERIFIED_ARBITRUM = 'true'
  try {
    assert.equal(getInstapoolV4Deployment(1).verified, true)
    assert.equal(getInstapoolV4Deployment(42161).verified, false)
  } finally {
    if (originalAddress === undefined) delete process.env.INSTAPOOL_V4_CONNECTOR_ETHEREUM
    else process.env.INSTAPOOL_V4_CONNECTOR_ETHEREUM = originalAddress
    if (originalEth === undefined) delete process.env.INSTAPOOL_V4_VERIFIED_ETHEREUM
    else process.env.INSTAPOOL_V4_VERIFIED_ETHEREUM = originalEth
    if (originalArb === undefined) delete process.env.INSTAPOOL_V4_VERIFIED_ARBITRUM
    else process.env.INSTAPOOL_V4_VERIFIED_ARBITRUM = originalArb
  }
})
