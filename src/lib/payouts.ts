import { query } from '@/lib/db'

const COMMISSION_RATE_KEY = 'commission_rate_percent'
const DEFAULT_FEE_PERCENT = 10

/**
 * The platform commission rate. Reads the persisted platform_settings value
 * first (set from /admin/settings), falling back to the PLATFORM_FEE_PERCENT
 * env var, then a hardcoded default — so the rate works the same way it
 * always did until an admin actually changes it through the UI.
 */
export async function getPlatformFeePercent(): Promise<number> {
  try {
    const res = await query<{ value: string }>('SELECT value FROM platform_settings WHERE key = $1', [COMMISSION_RATE_KEY])
    if ((res.rowCount ?? 0) > 0) {
      const parsed = Number(res.rows[0].value)
      if (Number.isFinite(parsed)) return Math.min(100, Math.max(0, parsed))
    }
  } catch (error) {
    console.error('[payouts] failed to read persisted commission rate, falling back:', error)
  }

  const raw = Number(process.env.PLATFORM_FEE_PERCENT)
  if (!Number.isFinite(raw)) return DEFAULT_FEE_PERCENT
  return Math.min(100, Math.max(0, raw))
}

export async function setPlatformFeePercent(percent: number, updatedBy: string): Promise<void> {
  const clamped = Math.min(100, Math.max(0, percent))
  await query(
    `INSERT INTO platform_settings (key, value, updated_by, updated_at)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (key) DO UPDATE SET value = $2, updated_by = $3, updated_at = NOW()`,
    [COMMISSION_RATE_KEY, String(clamped), updatedBy]
  )
}

export async function computeWithdrawalSplit(requestedAmount: number): Promise<{ feeAmount: number; netAmount: number }> {
  const percent = await getPlatformFeePercent()
  const totalCents = Math.round(requestedAmount * 100)
  const feeCents = Math.round(totalCents * (percent / 100))
  const netCents = totalCents - feeCents
  return { feeAmount: feeCents / 100, netAmount: netCents / 100 }
}
