export type SimulationRequest = {
  rpcUrl: string
  from: `0x${string}`
  to: `0x${string}`
  data: `0x${string}`
  value?: bigint
  expectedBlockNumber?: bigint
}

export type SimulationResult = {
  ok: true
  blockNumber: bigint
  gasEstimate?: bigint
} | {
  ok: false
  blockNumber?: bigint
  error: string
}

async function rpc(rpcUrl:string, method:string, params:unknown[]) {
  if (!rpcUrl) throw new Error('RPC_NOT_CONFIGURED')
  const response = await fetch(rpcUrl, {
    method:'POST',
    headers:{'content-type':'application/json'},
    body:JSON.stringify({jsonrpc:'2.0',id:1,method,params}),
    cache:'no-store',
  })
  if (!response.ok) throw new Error(`RPC_HTTP_${response.status}`)
  const json = await response.json() as {result?:string;error?:{message?:string}}
  if (json.error) throw new Error(json.error.message || 'RPC_ERROR')
  if (!json.result) throw new Error('RPC_NO_RESULT')
  return json.result
}

export async function simulateCall(request:SimulationRequest):Promise<SimulationResult>{
  try {
    const hexBlock = await rpc(request.rpcUrl,'eth_blockNumber',[])
    const blockNumber = BigInt(hexBlock)
    if (request.expectedBlockNumber !== undefined && blockNumber !== request.expectedBlockNumber) {
      return {ok:false,blockNumber,error:'BLOCK_CHANGED_BEFORE_SIMULATION'}
    }
    const call = {
      from: request.from,
      to: request.to,
      data: request.data,
      ...(request.value !== undefined ? {value:`0x${request.value.toString(16)}`} : {}),
    }
    await rpc(request.rpcUrl,'eth_call',[call,`0x${blockNumber.toString(16)}`])
    let gasEstimate:bigint|undefined
    try {
      gasEstimate = BigInt(await rpc(request.rpcUrl,'eth_estimateGas',[call]))
    } catch {
      // eth_call success is retained as the primary simulation result; gas is optional.
    }
    const finalBlock = BigInt(await rpc(request.rpcUrl,'eth_blockNumber',[]))
    if (finalBlock !== blockNumber) return {ok:false,blockNumber:finalBlock,error:'BLOCK_CHANGED_AFTER_SIMULATION'}
    return {ok:true,blockNumber,gasEstimate}
  } catch (error) {
    return {ok:false,error:error instanceof Error ? error.message : 'SIMULATION_FAILED'}
  }
}
