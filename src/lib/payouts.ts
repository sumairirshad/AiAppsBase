export function getPlatformFeePercent(): number {
  const raw = Number(process.env.PLATFORM_FEE_PERCENT)
  if (!Number.isFinite(raw)) return 5
  return Math.min(100, Math.max(0, raw))
}

export function computeWithdrawalSplit(requestedAmount: number): { feeAmount: number; netAmount: number } {
  const percent = getPlatformFeePercent()
  const totalCents = Math.round(requestedAmount * 100)
  const feeCents = Math.round(totalCents * (percent / 100))
  const netCents = totalCents - feeCents
  return { feeAmount: feeCents / 100, netAmount: netCents / 100 }
}
