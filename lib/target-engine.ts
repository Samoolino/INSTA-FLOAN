import {strategies} from './strategies'

export type Candidate={strategy:string;path:string;gross:number;cost:number;net:number;safe:boolean}
export type TargetConfig={targetProfit:number;minNetProfit:number;safetyReserve:number;maxPaths:number;maxCycles:number}

export function evaluateCandidates(candidates:Candidate[], cfg:TargetConfig){
  const usable=candidates.filter(c=>c.safe && c.net >= cfg.minNetProfit && c.net > cfg.safetyReserve)
    .sort((a,b)=>b.net-a.net).slice(0,cfg.maxPaths)
  let accumulated=0
  const selected:Candidate[]=[]
  for(const c of usable){
    selected.push(c); accumulated += c.net
    if(accumulated >= cfg.targetProfit) break
  }
  return {targetProfit:cfg.targetProfit,accumulatedProfit:accumulated,targetReached:accumulated>=cfg.targetProfit,selected,remaining:Math.max(0,cfg.targetProfit-accumulated),availableStrategies:strategies.length}
}
