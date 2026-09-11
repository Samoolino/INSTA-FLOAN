import type {FlashLiquidity} from './opportunity-assurance'

export function getFlashLiquidity(): FlashLiquidity[] {
  const raw = process.env.FLASH_LIQUIDITY
  if (!raw) return []
  let parsed: unknown
  try { parsed = JSON.parse(raw) } catch { throw new Error('INVALID_FLASH_LIQUIDITY_JSON') }
  if (!Array.isArray(parsed)) throw new Error('FLASH_LIQUIDITY_MUST_BE_ARRAY')

  return parsed.filter((item): item is FlashLiquidity => {
    if (!item || typeof item !== 'object') return false
    const x = item as Partial<FlashLiquidity>
    return typeof x.lender === 'string' && x.lender.length > 0
      && Number.isInteger(x.chainId)
      && typeof x.token === 'string' && x.token.length > 0
      && Number.isFinite(x.availableUsd) && x.availableUsd > 0
  })
}
