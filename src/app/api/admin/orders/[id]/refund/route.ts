import { NextRequest, NextResponse } from 'next/server'
import { getClientIp, isAdminGuardError, logAdminAction, requireAdmin } from '@/lib/admin'
import { refundOrder } from '@/lib/refunds'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAdmin()
  if (isAdminGuardError(guard)) return guard

  let reason: string
  let notes: string | undefined
  try {
    const body = await req.json()
    reason = typeof body.reason === 'string' ? body.reason.trim() : ''
    notes = typeof body.notes === 'string' ? body.notes.trim() : undefined
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
  if (!reason) {
    return NextResponse.json({ error: 'A refund reason is required' }, { status: 400 })
  }

  const result = await refundOrder(params.id, reason)

  switch (result.kind) {
    case 'not_found':
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    case 'already_refunded':
      return NextResponse.json({ error: 'This order has already been refunded' }, { status: 409 })
    case 'no_payment_intent':
      return NextResponse.json(
        { error: 'This order has no linked Stripe payment and cannot be refunded automatically' },
        { status: 400 }
      )
    case 'stripe_failed':
      return NextResponse.json({ error: `Refund failed: ${result.message}` }, { status: 502 })
    case 'refunded':
      // Seller earnings reversal: the withdrawal balance query only sums
      // orders with status='completed', so this refund is excluded from the
      // seller's available balance going forward the moment it commits —
      // no separate "reverse earnings" step is needed.
      await logAdminAction({
        adminId: guard.id,
        action: 'order.refunded',
        targetType: 'order',
        targetId: params.id,
        reason,
        notes,
        newValue: { status: 'refunded', amount: result.amount, sellerId: result.sellerId, stripeRefundId: result.stripeRefundId },
        ipAddress: getClientIp(req),
      })
      return NextResponse.json({ ok: true, status: 'refunded' })
  }
}
