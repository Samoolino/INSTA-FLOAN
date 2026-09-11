import {strict as assert} from 'node:assert'
import {test} from 'node:test'
import {buildInstadappCastCall, assertInstadappExecutionReady, getInstadappCastEngineStatus, INSTADAPP_CAST_ENGINE} from './instadapp-adapter'

const account='0x0000000000000000000000000000000000000001' as `0x${string}`
const target='UNISWAP-V2-A'
const origin='0x0000000000000000000000000000000000000003' as `0x${string}`

const valid={smartAccount:account,targets:[target],datas:['0x1234' as `0x${string}`],origin}

test('Instadapp boundary rejects empty targets',()=>assert.throws(()=>buildInstadappCastCall({...valid,targets:[]}),/MISSING_CAST_TARGETS/))
test('Instadapp boundary rejects mismatched target/data arrays',()=>assert.throws(()=>buildInstadappCastCall({...valid,datas:[]}),/CAST_ARRAY_LENGTH_MISMATCH/))
test('Instadapp boundary rejects empty target names',()=>assert.throws(()=>buildInstadappCastCall({...valid,targets:['']}),/INVALID_CAST_TARGET/))
test('Instadapp boundary rejects empty calldata',()=>assert.throws(()=>buildInstadappCastCall({...valid,datas:['0x' as `0x${string}`]}),/MISSING_CAST_DATA/))
test('Instadapp boundary produces a cast simulation call without submission',()=>{
 const call=buildInstadappCastCall(valid)
 assert.equal(call.from,account)
 assert.equal(call.to,account)
 assert.ok(call.data.startsWith('0x'))
 assert.notEqual(call.data,'0x')
})
test('Cast engine is direct DSL ABI rather than archived SDK',()=>{
 const status=getInstadappCastEngineStatus()
 assert.equal(status.engine,INSTADAPP_CAST_ENGINE.name)
 assert.equal(status.mode,'direct-abi')
 assert.equal(status.castSignature,'cast(string[],bytes[],address)')
 assert.equal(status.liveExecution,'BLOCKED')
 assert.match(status.archivedSdkReference,/1\.5\.15/)
})
test('live Instadapp execution remains explicitly blocked',()=>assert.throws(()=>assertInstadappExecutionReady(),/VERIFIED_MODULE_SIGNATURE_AND_DEPLOYMENT/))
