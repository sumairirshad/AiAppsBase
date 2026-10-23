import { NextRequest, NextResponse } from 'next/server'
import { getClientIp, isAdminGuardError, logAdminAction, requireAdmin } from '@/lib/admin'
import { TICKET_STATUSES, getTicketWithReplies, setTicketStatus } from '@/lib/support-tickets'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAdmin()
  if (isAdminGuardError(guard)) return guard

  const ticket = await getTicketWithReplies(params.id)
  if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })

  return NextResponse.json({ ticket })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAdmin()
  if (isAdminGuardError(guard)) return guard

  const body = await req.json().catch(() => null)
  const status = body && typeof body.status === 'string' ? body.status : ''
  if (!TICKET_STATUSES.includes(status as any)) {
    return NextResponse.json({ error: `status must be one of: ${TICKET_STATUSES.join(', ')}` }, { status: 400 })
  }

  const updated = await setTicketStatus(params.id, status as any)
  if (!updated) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })

  await logAdminAction({
    adminId: guard.id,
    action: 'support_ticket.status_changed',
    targetType: 'support_ticket',
    targetId: params.id,
    reason: `Status set to ${status}`,
    newValue: { status },
    ipAddress: getClientIp(req),
  })

  return NextResponse.json({ ok: true })
}
