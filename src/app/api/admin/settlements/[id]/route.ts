import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getClientIp, isAdminGuardError, logAdminAction, requireAdmin } from '@/lib/admin'
import { sendPayoutStatusEmail } from '@/lib/email'
import { processWithdrawalAction } from '@/lib/settlements'

async function notifyPayoutStatusBestEffort(
  sellerId: string,
  status: 'approved' | 'rejected',
  netAmount: number,
  reason?: string | null
) {
  try {
    const sellerRes = await query<{ email: string; email_notifications_enabled: boolean }>(
      'SELECT email, email_notifications_enabled FROM users WHERE id = $1',
      [sellerId]
    )
    const seller = sellerRes.rows[0]
    if (!seller?.email || !seller.email_notifications_enabled) return
    await sendPayoutStatusEmail(seller.email, { status, netAmount, reason })
  } catch (error) {
    console.error('[admin/settlements] Failed to send payout status email', sellerId, error)
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAdmin()
  if (isAdminGuardError(guard)) return guard
  const userId = guard.id

  let action: string
  let reason: string | undefined
  try {
    const body = await req.json()
    action = body.action
    reason = body.reason
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (action !== 'approve' && action !== 'reject') {
    return NextResponse.json({ error: 'action must be "approve" or "reject"' }, { status: 400 })
  }

  const result = await processWithdrawalAction(params.id, action, userId, reason)
  const ipAddress = getClientIp(req)

  switch (result.kind) {
    case 'not_found':
      return NextResponse.json({ error: 'Withdrawal request not found' }, { status: 404 })
    case 'already_processed':
      return NextResponse.json({ error: 'This request has already been processed' }, { status: 409 })
    case 'rejected':
      await logAdminAction({
        adminId: userId,
        action: 'payout.rejected',
        targetType: 'withdrawal_request',
        targetId: params.id,
        reason: reason || 'No reason provided',
        newValue: { status: 'rejected', sellerId: result.sellerId, netAmount: result.netAmount },
        ipAddress,
      })
      await notifyPayoutStatusBestEffort(result.sellerId, 'rejected', result.netAmount, reason)
      return NextResponse.json({ ok: true, status: 'rejected' })
    case 'not_payout_capable':
      return NextResponse.json(
        { error: "Seller's Stripe account is not payout-capable yet — ask them to finish onboarding" },
        { status: 400 }
      )
    case 'approved':
      await logAdminAction({
        adminId: userId,
        action: 'payout.approved',
        targetType: 'withdrawal_request',
        targetId: params.id,
        reason: 'Approved by admin',
        newValue: { status: 'approved', sellerId: result.sellerId, netAmount: result.netAmount, transferId: result.transferId },
        ipAddress,
      })
      await notifyPayoutStatusBestEffort(result.sellerId, 'approved', result.netAmount)
      return NextResponse.json({ ok: true, status: 'approved', transferId: result.transferId })
    case 'transfer_failed':
      await logAdminAction({
        adminId: userId,
        action: 'payout.transfer_failed',
        targetType: 'withdrawal_request',
        targetId: params.id,
        reason: result.message,
        newValue: { status: 'failed', sellerId: result.sellerId, netAmount: result.netAmount },
        ipAddress,
      })
      return NextResponse.json({ error: `Transfer failed: ${result.message}` }, { status: 502 })
  }
}
