import { NextRequest, NextResponse } from 'next/server'
import { getSessionUserId } from '@/lib/session'
import { addTicketReply, getTicketWithReplies } from '@/lib/support-tickets'
import { rateLimit } from '@/lib/rate-limit'

const MAX_MESSAGE_LENGTH = 5000

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const limited = await rateLimit(req, 'support:reply', 30, 600)
  if (limited) return limited

  const userId = await getSessionUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const ticket = await getTicketWithReplies(params.id)
  if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
  if (ticket.user_id !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json().catch(() => null)
  const message = body && typeof body.message === 'string' ? body.message.trim() : ''
  if (!message) return NextResponse.json({ error: 'Message is required' }, { status: 400 })
  if (message.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json({ error: `Message must be ${MAX_MESSAGE_LENGTH} characters or fewer` }, { status: 400 })
  }

  await addTicketReply(params.id, userId, false, message)
  return NextResponse.json({ ok: true })
}
