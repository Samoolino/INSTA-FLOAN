import {getAddress, type Address} from 'viem'

export type V2VenueConfig = {
  label: string
  router: Address
}

function requiredAddress(name:string, value:string|undefined):Address {
  if (!value) throw new Error(`${name}_NOT_CONFIGURED`)
  try { return getAddress(value) }
  catch { throw new Error(`${name}_INVALID_ADDRESS`) }
}

export function loadV2VenueConfig(env:NodeJS.ProcessEnv = process.env):V2VenueConfig[] {
  const entries = [
    ['V2_VENUE_A_ROUTER', env.V2_VENUE_A_ROUTER],
    ['V2_VENUE_B_ROUTER', env.V2_VENUE_B_ROUTER],
  ] as const
  return entries.map(([name,value]) => ({label:name, router:requiredAddress(name,value)}))
}
