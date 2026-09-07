import {strategies} from './strategies'

export type Candidate={strategy:string;path:string;gross:number;cost:number;net:number;safe:boolean}
export type TargetConfig={targetProfit:number;minNetProfit:number;safetyReserve:number;maxPaths:number;maxCycles:number}

function finitePositive(value:number){
  return Number.isFinite(value) && value > 0
}

export function evaluateCandidates(candidates:Candidate[], cfg:TargetConfig){
  if(!finitePositive(cfg.targetProfit)) throw new Error('targetProfit must be a positive finite number')
  if(!finitePositive(cfg.minNetProfit)) throw new Error('minNetProfit must be a positive finite number')
  if(!Number.isFinite(cfg.safetyReserve) || cfg.safetyReserve < 0) throw new Error('safetyReserve must be a finite non-negative number')
  if(!Number.isInteger(cfg.maxPaths) || cfg.maxPaths < 1) throw new Error('maxPaths must be a positive integer')
  if(!Number.isInteger(cfg.maxCycles) || cfg.maxCycles < 1) throw new Error('maxCycles must be a positive integer')

  const usable=candidates
    .filter(c => c.safe && finitePositive(c.net) && c.net >= cfg.minNetProfit && c.net > cfg.safetyReserve)
    .sort((a,b)=>b.net-a.net)
    .slice(0, Math.min(cfg.maxPaths, cfg.maxCycles))

  let accumulated=0
  const selected:Candidate[]=[]
  for(const c of usable){
    selected.push(c)
    accumulated += c.net
    if(accumulated >= cfg.targetProfit) break
  }

  return {
    targetProfit:cfg.targetProfit,
    accumulatedProfit:accumulated,
    targetReached:accumulated>=cfg.targetProfit,
    selected,
    remaining:Math.max(0,cfg.targetProfit-accumulated),
    availableStrategies:strategies.length,
    candidateCount:candidates.length,
    eligibleCount:usable.length,
    cycleCount:selected.length,
  }
}
