import {strict as assert} from 'node:assert'
import {test} from 'node:test'
import {type Address, type Hex} from 'viem'
import {buildTwoLegUniswapInstapoolSimulation} from './instapool-v4-route'
import {simulateOnLocalFork} from './local-fork-simulation'
import {readTokenBalance} from './token-balance'

const enabled=process.env.INSTA_FORK_INTEGRATION === 'true'
const rpcUrl=process.env.INSTA_FORK_RPC_URL || ''

function requiredEnv(name:string):string {
  const value=process.env[name]
  if (!value) throw new Error(`INSTA_FORK_ENV_REQUIRED:${name}`)
  return value
}

function address(name:string):Address {
  return requiredEnv(name) as Address
}

function amount(name:string):bigint {
  const value=BigInt(requiredEnv(name))
  if (value <= 0n) throw new Error(`INSTA_FORK_INVALID_AMOUNT:${name}`)
  return value
}

function route(requiredRepaymentAmount:bigint) {
  const flashAmount=amount('INSTA_FORK_FLASH_AMOUNT')
  const expectedFinalAmount=amount('INSTA_FORK_EXPECTED_FINAL_AMOUNT')
  if (requiredRepaymentAmount < flashAmount) throw new Error('INSTA_FORK_REPAYMENT_BELOW_PRINCIPAL')
  if (expectedFinalAmount < requiredRepaymentAmount) throw new Error('INSTA_FORK_EXPECTED_REPAYMENT_SHORTFALL')

  return {
    flash:{token:address('INSTA_FORK_TOKEN_A'), amount:flashAmount, route:0n},
    legOne:{
      buyAddr:address('INSTA_FORK_TOKEN_B'),
      sellAddr:address('INSTA_FORK_TOKEN_A'),
      sellAmt:flashAmount,
      unitAmt:amount('INSTA_FORK_LEG_ONE_UNIT_AMT'),
    },
    legTwo:{
      buyAddr:address('INSTA_FORK_TOKEN_A'),
      sellAddr:address('INSTA_FORK_TOKEN_B'),
      sellAmt:amount('INSTA_FORK_LEG_TWO_SELL_AMOUNT'),
      unitAmt:amount('INSTA_FORK_LEG_TWO_UNIT_AMT'),
    },
    expectedFinalAmount,
    requiredRepaymentAmount,
  }
}

async function rpc(method:string, params:unknown[]) {
  const response=await fetch(rpcUrl, {
    method:'POST',
    headers:{'content-type':'application/json'},
    body:JSON.stringify({jsonrpc:'2.0',id:1,method,params}),
    cache:'no-store',
  })
  if (!response.ok) throw new Error(`RPC_HTTP_${response.status}`)
  const json=await response.json() as {result?:unknown; error?:{message?:string}}
  if (json.error) throw new Error(json.error.message || 'RPC_ERROR')
  if (json.result === undefined || json.result === null) throw new Error('RPC_NO_RESULT')
  return json.result
}

const integrationTest=enabled ? test : test.skip

integrationTest('executes the exact Instapool V4 two-leg route on a loopback fork',async()=>{
  const requiredRepaymentAmount=amount('INSTA_FORK_REQUIRED_REPAYMENT_AMOUNT')
  const simulation=buildTwoLegUniswapInstapoolSimulation({
    chainId:Number(requiredEnv('INSTA_FORK_CHAIN_ID')),
    connector:address('INSTA_FORK_CONNECTOR'),
    smartAccount:address('INSTA_FORK_SMART_ACCOUNT'),
    origin:address('INSTA_FORK_ORIGIN'),
    route:route(requiredRepaymentAmount),
  })

  const result=await simulateOnLocalFork({
    rpcUrl,
    from:simulation.from,
    to:simulation.to,
    data:simulation.data,
    token:address('INSTA_FORK_TOKEN_A'),
    account:address('INSTA_FORK_SMART_ACCOUNT'),
  })

  assert.equal(result.transactionHash.startsWith('0x'),true)
})

integrationTest('under-repayment reverts atomically and restores the fork snapshot',async()=>{
  const actualRepayment=amount('INSTA_FORK_REQUIRED_REPAYMENT_AMOUNT')
  if (actualRepayment <= amount('INSTA_FORK_FLASH_AMOUNT')) throw new Error('INSTA_FORK_NO_FEE_FOR_NEGATIVE_CASE')

  const underRepayment=actualRepayment-1n
  const simulation=buildTwoLegUniswapInstapoolSimulation({
    chainId:Number(requiredEnv('INSTA_FORK_CHAIN_ID')),
    connector:address('INSTA_FORK_CONNECTOR'),
    smartAccount:address('INSTA_FORK_SMART_ACCOUNT'),
    origin:address('INSTA_FORK_ORIGIN'),
    route:route(underRepayment),
  })

  const token=address('INSTA_FORK_TOKEN_A')
  const account=address('INSTA_FORK_SMART_ACCOUNT')
  const block=BigInt(await rpc('eth_blockNumber',[]) as string)
  const preBalance=await readTokenBalance({rpcUrl,token,account,blockNumber:block})
  const snapshot=await rpc('evm_snapshot',[]) as string
  assert.ok(snapshot)

  try {
    const txHash=await rpc('eth_sendTransaction',[{
      from:simulation.from,
      to:simulation.to,
      data:simulation.data,
    }]) as Hex
    const receipt=await rpc('eth_getTransactionReceipt',[txHash]) as {status?:string}
    assert.equal(receipt.status,'0x0')
  } finally {
    assert.equal(await rpc('evm_revert',[snapshot]),true)
  }

  const restoredBlock=BigInt(await rpc('eth_blockNumber',[]) as string)
  const restoredBalance=await readTokenBalance({rpcUrl,token,account,blockNumber:restoredBlock})
  assert.equal(restoredBalance,preBalance)
})
