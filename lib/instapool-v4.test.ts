import {strict as assert} from 'node:assert'
import {test} from 'node:test'
import {buildInstapoolV4FlashBorrowCall, buildVerifiedInstapoolV4FlashBorrowCall, encodeInstapoolV4FlashData, assertInstapoolV4DeploymentVerified} from './instapool-v4'

const account='0x0000000000000000000000000000000000000001' as `0x${string}`
const connector='0x0000000000000000000000000000000000000002' as `0x${string}`
const origin='0x0000000000000000000000000000000000000003' as `0x${string}`
const token='0x0000000000000000000000000000000000000004' as `0x${string}`

const valid={
  chainId:1,
  connector,
  smartAccount:account,
  origin,
  flash:{
    token,
    amount:1000000n,
    route:5n,
    targets:['UNISWAP-V2-A'],
    callDatas:['0x1234' as `0x${string}`],
  },
}

test('Instapool v4 flash data encodes connector target names and calldata',()=>{
  const encoded=encodeInstapoolV4FlashData(valid.flash)
  assert.ok(encoded.startsWith('0x'))
  assert.notEqual(encoded,'0x')
})

test('Instapool v4 rejects mismatched target/data arrays',()=>assert.throws(()=>encodeInstapoolV4FlashData({...valid.flash,callDatas:[]}),/FLASH_TARGET_DATA_LENGTH_MISMATCH/))

test('Instapool v4 rejects empty flash amount',()=>assert.throws(()=>encodeInstapoolV4FlashData({...valid.flash,amount:0n}),/INVALID_FLASH_AMOUNT/))

test('Instapool v4 builds only with the chain registry connector',()=>{
  const originalAddress=process.env.INSTAPOOL_V4_CONNECTOR_ETHEREUM
  const originalVerified=process.env.INSTAPOOL_V4_VERIFIED_ETHEREUM
  process.env.INSTAPOOL_V4_CONNECTOR_ETHEREUM=connector
  process.env.INSTAPOOL_V4_VERIFIED_ETHEREUM='true'
  try {
    const call=buildInstapoolV4FlashBorrowCall(valid)
    assert.equal(call.from,account)
    assert.equal(call.to,account)
    assert.ok(call.data.startsWith('0x'))
    assert.notEqual(call.data,'0x')
  } finally {
    if(originalAddress===undefined) delete process.env.INSTAPOOL_V4_CONNECTOR_ETHEREUM
    else process.env.INSTAPOOL_V4_CONNECTOR_ETHEREUM=originalAddress
    if(originalVerified===undefined) delete process.env.INSTAPOOL_V4_VERIFIED_ETHEREUM
    else process.env.INSTAPOOL_V4_VERIFIED_ETHEREUM=originalVerified
  }
})

test('Instapool v4 verified construction requires an expected on-chain identity',async()=>{
  const originalAddress=process.env.INSTAPOOL_V4_CONNECTOR_ETHEREUM
  const originalVerified=process.env.INSTAPOOL_V4_VERIFIED_ETHEREUM
  const originalHash=process.env.INSTAPOOL_V4_BYTECODE_HASH_ETHEREUM
  const originalRpc=process.env.ETH_RPC_URL
  process.env.INSTAPOOL_V4_CONNECTOR_ETHEREUM=connector
  process.env.INSTAPOOL_V4_VERIFIED_ETHEREUM='true'
  delete process.env.INSTAPOOL_V4_BYTECODE_HASH_ETHEREUM
  delete process.env.ETH_RPC_URL
  try {
    await assert.rejects(()=>buildVerifiedInstapoolV4FlashBorrowCall(valid),/CHAIN_RPC_NOT_CONFIGURED|EXPECTED_BYTECODE_HASH_NOT_CONFIGURED/)
  } finally {
    if(originalAddress===undefined) delete process.env.INSTAPOOL_V4_CONNECTOR_ETHEREUM
    else process.env.INSTAPOOL_V4_CONNECTOR_ETHEREUM=originalAddress
    if(originalVerified===undefined) delete process.env.INSTAPOOL_V4_VERIFIED_ETHEREUM
    else process.env.INSTAPOOL_V4_VERIFIED_ETHEREUM=originalVerified
    if(originalHash===undefined) delete process.env.INSTAPOOL_V4_BYTECODE_HASH_ETHEREUM
    else process.env.INSTAPOOL_V4_BYTECODE_HASH_ETHEREUM=originalHash
    if(originalRpc===undefined) delete process.env.ETH_RPC_URL
    else process.env.ETH_RPC_URL=originalRpc
  }
})

test('Instapool v4 rejects connector mismatch against the verified chain registry',()=>{
  const originalAddress=process.env.INSTAPOOL_V4_CONNECTOR_ETHEREUM
  const originalVerified=process.env.INSTAPOOL_V4_VERIFIED_ETHEREUM
  process.env.INSTAPOOL_V4_CONNECTOR_ETHEREUM='0x0000000000000000000000000000000000000009'
  process.env.INSTAPOOL_V4_VERIFIED_ETHEREUM='true'
  try {
    assert.throws(()=>buildInstapoolV4FlashBorrowCall(valid),/INSTAPOOL_V4_CONNECTOR_MISMATCH/)
  } finally {
    if(originalAddress===undefined) delete process.env.INSTAPOOL_V4_CONNECTOR_ETHEREUM
    else process.env.INSTAPOOL_V4_CONNECTOR_ETHEREUM=originalAddress
    if(originalVerified===undefined) delete process.env.INSTAPOOL_V4_VERIFIED_ETHEREUM
    else process.env.INSTAPOOL_V4_VERIFIED_ETHEREUM=originalVerified
  }
})

test('Instapool v4 remains fail-closed when the chain deployment is unverified',()=>{
  const originalAddress=process.env.INSTAPOOL_V4_CONNECTOR_ETHEREUM
  const originalVerified=process.env.INSTAPOOL_V4_VERIFIED_ETHEREUM
  delete process.env.INSTAPOOL_V4_CONNECTOR_ETHEREUM
  process.env.INSTAPOOL_V4_VERIFIED_ETHEREUM='true'
  try {
    assert.throws(()=>buildInstapoolV4FlashBorrowCall(valid),/INSTAPOOL_V4_CONNECTOR_NOT_CONFIGURED|INSTAPOOL_V4_DEPLOYMENT_NOT_VERIFIED/)
  } finally {
    if(originalAddress===undefined) delete process.env.INSTAPOOL_V4_CONNECTOR_ETHEREUM
    else process.env.INSTAPOOL_V4_CONNECTOR_ETHEREUM=originalAddress
    if(originalVerified===undefined) delete process.env.INSTAPOOL_V4_VERIFIED_ETHEREUM
    else process.env.INSTAPOOL_V4_VERIFIED_ETHEREUM=originalVerified
  }
})

test('Instapool v4 explicit legacy verification gate remains fail-closed',()=>assert.throws(()=>assertInstapoolV4DeploymentVerified(false),/INSTAPOOL_V4_DEPLOYMENT_NOT_VERIFIED/))

test('Instapool v4 verified flag can authorize the explicit legacy boundary',()=>assert.doesNotThrow(()=>assertInstapoolV4DeploymentVerified(true)))
