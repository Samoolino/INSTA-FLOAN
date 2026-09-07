import {strict as assert} from 'node:assert'
import {test} from 'node:test'
import {evaluateCandidates, type Candidate} from './target-engine'

const candidate=(net:number, safe=true):Candidate=>({strategy:'test',path:'A→B→A',gross:net+2,cost:2,net,safe})

test('selects highest-net eligible candidates until target is reached',()=>{
  const result=evaluateCandidates([candidate(4),candidate(12),candidate(7),candidate(1)],{
    targetProfit:18,minNetProfit:5,safetyReserve:2,maxPaths:10,maxCycles:10,
  })
  assert.equal(result.targetReached,true)
  assert.equal(result.accumulatedProfit,19)
  assert.equal(result.selected.length,2)
  assert.equal(result.selected[0].net,12)
})

test('never selects unsafe or below-threshold candidates',()=>{
  const result=evaluateCandidates([candidate(50,false),candidate(3),candidate(8)],{
    targetProfit:20,minNetProfit:5,safetyReserve:2,maxPaths:10,maxCycles:10,
  })
  assert.equal(result.targetReached,false)
  assert.equal(result.accumulatedProfit,8)
  assert.equal(result.selected.length,1)
})

test('enforces both path and cycle limits',()=>{
  const result=evaluateCandidates([candidate(10),candidate(9),candidate(8)],{
    targetProfit:25,minNetProfit:5,safetyReserve:2,maxPaths:5,maxCycles:2,
  })
  assert.equal(result.selected.length,2)
  assert.equal(result.accumulatedProfit,19)
  assert.equal(result.cycleCount,2)
})

test('rejects invalid execution configuration',()=>{
  assert.throws(()=>evaluateCandidates([],{
    targetProfit:0,minNetProfit:5,safetyReserve:2,maxPaths:1,maxCycles:1,
  }))
  assert.throws(()=>evaluateCandidates([],{
    targetProfit:10,minNetProfit:5,safetyReserve:2,maxPaths:0,maxCycles:1,
  }))
})
