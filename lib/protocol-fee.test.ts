import {strict as assert} from 'node:assert'
import {test} from 'node:test'
import {calculateProtocolFeeUsd, requireProtocolFeeUsd} from './protocol-fee'

test('protocol fee is calculated from explicit basis points',()=>{
  assert.equal(calculateProtocolFeeUsd({feeBps:30,notionalUsd:1000}),3)
})

test('protocol fee rejects negative basis points',()=>assert.throws(()=>calculateProtocolFeeUsd({feeBps:-1,notionalUsd:1000}),/INVALID_PROTOCOL_FEE_BPS/))

test('protocol fee rejects basis points above 100 percent',()=>assert.throws(()=>calculateProtocolFeeUsd({feeBps:10001,notionalUsd:1000}),/INVALID_PROTOCOL_FEE_BPS/))

test('protocol fee rejects non-positive notional',()=>assert.throws(()=>calculateProtocolFeeUsd({feeBps:30,notionalUsd:0}),/INVALID_PROTOCOL_FEE_NOTIONAL/))

test('execution cannot silently treat an unconfigured protocol fee as zero',()=>assert.throws(()=>requireProtocolFeeUsd(undefined),/PROTOCOL_FEE_NOT_CONFIGURED/))

test('configured protocol fee is accepted only when finite and non-negative',()=>{
  assert.equal(requireProtocolFeeUsd(0),0)
  assert.equal(requireProtocolFeeUsd(2.5),2.5)
})

test('invalid protocol fee amount is rejected',()=>assert.throws(()=>requireProtocolFeeUsd(Number.NaN),/INVALID_PROTOCOL_FEE_USD/))
