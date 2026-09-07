import {strict as assert} from 'node:assert'
import {test} from 'node:test'
import {buildInstadappCastCall, assertInstadappExecutionReady} from './instadapp-adapter'

const account='0x0000000000000000000000000000000000000001' as `0x${string}`
const module='0x0000000000000000000000000000000000000002' as `0x${string}`

test('Instadapp boundary rejects empty payload',()=>assert.throws(()=>buildInstadappCastCall({smartAccount:account,module,payload:'0x'}),/MISSING_CAST_PAYLOAD/))
test('Instadapp boundary produces a simulation call without submission',()=>{
 const call=buildInstadappCastCall({smartAccount:account,module,payload:'0x1234'})
 assert.equal(call.from,account)
 assert.equal(call.to,account)
 assert.ok(call.data.startsWith('0x'))
 assert.notEqual(call.data,'0x')
})
test('live Instadapp execution remains explicitly blocked',()=>assert.throws(()=>assertInstadappExecutionReady(),/VERIFIED_MODULE_SIGNATURE_AND_DEPLOYMENT/))
