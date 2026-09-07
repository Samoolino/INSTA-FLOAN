export type ProtocolFeeModel = {
  /** Fee charged by the venue in basis points. Must be explicitly configured. */
  feeBps: number
  /** Notional value used to calculate the protocol fee. */
  notionalUsd: number
}

export function calculateProtocolFeeUsd(model: ProtocolFeeModel): number {
  if (!Number.isFinite(model.feeBps) || model.feeBps < 0 || model.feeBps > 10_000) {
    throw new Error('INVALID_PROTOCOL_FEE_BPS')
  }
  if (!Number.isFinite(model.notionalUsd) || model.notionalUsd <= 0) {
    throw new Error('INVALID_PROTOCOL_FEE_NOTIONAL')
  }
  return model.notionalUsd * model.feeBps / 10_000
}

/**
 * Exact fee modeling is fail-closed: an absent venue fee must never silently
 * become zero. Callers must obtain the fee from verified venue configuration
 * or authoritative pool state before an execution plan can be considered.
 */
export function requireProtocolFeeUsd(feeUsd: number | undefined): number {
  if (feeUsd === undefined) throw new Error('PROTOCOL_FEE_NOT_CONFIGURED')
  if (!Number.isFinite(feeUsd) || feeUsd < 0) throw new Error('INVALID_PROTOCOL_FEE_USD')
  return feeUsd
}
