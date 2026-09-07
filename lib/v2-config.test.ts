import {strict as assert} from 'node:assert'
import {test} from 'node:test'
import {loadV2VenueConfig} from './v2-config'

test('V2 venue config fails closed when router addresses are missing',()=>{
  assert.throws(()=>loadV2VenueConfig({}),/V2_VENUE_A_ROUTER_NOT_CONFIGURED/)
})

test('V2 venue config rejects malformed router addresses',()=>{
  assert.throws(()=>loadV2VenueConfig({V2_VENUE_A_ROUTER:'not-an-address',V2_VENUE_B_ROUTER:'0x0000000000000000000000000000000000000002'}),/V2_VENUE_A_ROUTER_INVALID_ADDRESS/)
})

test('V2 venue config normalizes valid checksummed or lowercase addresses',()=>{
  const result=loadV2VenueConfig({V2_VENUE_A_ROUTER:'0x0000000000000000000000000000000000000001',V2_VENUE_B_ROUTER:'0x0000000000000000000000000000000000000002'})
  assert.equal(result.length,2)
  assert.equal(result[0].router,'0x0000000000000000000000000000000000000001')
})
