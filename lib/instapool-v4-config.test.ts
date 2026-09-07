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
  const deployment = getInstapoolV4Deployment(56)
  assert.equal(deployment.connector, undefined)
  assert.equal(deployment.verified, false)
})
