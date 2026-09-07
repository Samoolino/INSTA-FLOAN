import {strict as assert} from 'node:assert'
import {test} from 'node:test'
import {buildInstapoolV4FlashBorrowCall, encodeInstapoolV4FlashData, assertInstapoolV4DeploymentVerified} from './instapool-v4'

const account='0x0000000000000000000000000000000000000001' as `0x${string}`
const connector='0x0000000000000000000000000000000000000002' as `0x${string}`
const origin='0x0000000000000000000000000000000000000003' as `0x${string}`
const token='0x0000000000000000000000000000000000000004' as `0x${string}`

const valid={
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

test('Instapool v4 builds an outer Smart Account cast simulation call',()=>{
  const call=buildInstapoolV4FlashBorrowCall(valid)
  assert.equal(call.from,account)
  assert.equal(call.to,account)
  assert.ok(call.data.startsWith('0x'))
  assert.notEqual(call.data,'0x')
})

test('Instapool v4 deployment remains fail-closed until verified',()=>assert.throws(()=>assertInstapoolV4DeploymentVerified(false),/INSTAPOOL_V4_DEPLOYMENT_NOT_VERIFIED/))

test('Instapool v4 verified flag can authorize the adapter boundary',()=>assert.doesNotThrow(()=>assertInstapoolV4DeploymentVerified(true)))
