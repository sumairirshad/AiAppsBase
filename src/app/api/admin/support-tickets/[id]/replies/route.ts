import { NextRequest, NextResponse } from 'next/server'
import { getClientIp, isAdminGuardError, logAdminAction, requireAdmin } from '@/lib/admin'
import { addTicketReply } from '@/lib/support-tickets'

const MAX_MESSAGE_LENGTH = 5000

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAdmin()
  if (isAdminGuardError(guard)) return guard

  const body = await req.json().catch(() => null)
  const message = body && typeof body.message === 'string' ? body.message.trim() : ''
  if (!message) return NextResponse.json({ error: 'Message is required' }, { status: 400 })
  if (message.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json({ error: `Message must be ${MAX_MESSAGE_LENGTH} characters or fewer` }, { status: 400 })
  }

  const added = await addTicketReply(params.id, guard.id, true, message)
  if (!added) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })

  await logAdminAction({
    adminId: guard.id,
    action: 'support_ticket.replied',
    targetType: 'support_ticket',
    targetId: params.id,
    reason: 'Admin replied to support ticket',
    ipAddress: getClientIp(req),
  })

  return NextResponse.json({ ok: true })
}
