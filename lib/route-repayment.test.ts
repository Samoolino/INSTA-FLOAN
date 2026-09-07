import {strict as assert} from 'node:assert'
import {test} from 'node:test'
import {checkRepayment} from './route-repayment'

test('repayment passes when final amount covers principal and fee',()=>{
  const result=checkRepayment(1000n,5n,1010n)
  assert.equal(result.requiredRepayment,1005n)
  assert.equal(result.surplus,5n)
  assert.equal(result.sufficient,true)
})

test('repayment fails when final amount is insufficient',()=>{
  const result=checkRepayment(1000n,5n,1004n)
  assert.equal(result.surplus,0n)
  assert.equal(result.sufficient,false)
})

test('negative fee is rejected',()=>{
  assert.throws(()=>checkRepayment(1000n,-1n,1010n),/INVALID_FEE_AMOUNT/)
})
