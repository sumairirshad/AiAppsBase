import { NextResponse } from 'next/server'
import { getSessionUserId } from '@/lib/session'
import { getTicketWithReplies } from '@/lib/support-tickets'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const userId = await getSessionUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const ticket = await getTicketWithReplies(params.id)
  if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })

  // IDOR protection: a ticket id alone never grants access to someone
  // else's ticket, however it was obtained.
  if (ticket.user_id !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return NextResponse.json({ ticket })
}
