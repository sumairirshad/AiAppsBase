import { NextRequest, NextResponse } from 'next/server'
import { getClientIp, isAdminGuardError, logAdminAction, requireAdmin } from '@/lib/admin'
import { getPlatformFeePercent, setPlatformFeePercent } from '@/lib/payouts'

export async function PATCH(req: NextRequest) {
  const guard = await requireAdmin()
  if (isAdminGuardError(guard)) return guard

  const body = await req.json().catch(() => null)
  const percent = Number(body?.percent)
  if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
    return NextResponse.json({ error: 'Commission rate must be a number between 0 and 100' }, { status: 400 })
  }

  const previous = await getPlatformFeePercent()
  await setPlatformFeePercent(percent, guard.id)

  await logAdminAction({
    adminId: guard.id,
    action: 'settings.commission_rate.updated',
    targetType: 'platform_settings',
    targetId: 'commission_rate_percent',
    reason: `Updated commission rate to ${percent}%`,
    previousValue: { percent: previous },
    newValue: { percent },
    ipAddress: getClientIp(req),
  })

  return NextResponse.json({ ok: true, percent })
}
