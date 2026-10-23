import { NextRequest, NextResponse } from 'next/server'
import { getSessionUserId } from '@/lib/session'
import { query } from '@/lib/db'
import { createTicket, listTicketsForUser } from '@/lib/support-tickets'
import { rateLimit } from '@/lib/rate-limit'

const MAX_SUBJECT_LENGTH = 200
const MAX_MESSAGE_LENGTH = 5000

export async function GET() {
  const userId = await getSessionUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tickets = await listTicketsForUser(userId)
  return NextResponse.json({ tickets })
}

export async function POST(req: NextRequest) {
  const limited = await rateLimit(req, 'support:create-ticket', 10, 600)
  if (limited) return limited

  const userId = await getSessionUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const subject = typeof body.subject === 'string' ? body.subject.trim() : ''
  const message = typeof body.message === 'string' ? body.message.trim() : ''
  const orderId = typeof body.orderId === 'string' && body.orderId ? body.orderId : null
  const productId = typeof body.productId === 'string' && body.productId ? body.productId : null

  if (!subject || !message) {
    return NextResponse.json({ error: 'Subject and message are required' }, { status: 400 })
  }
  if (subject.length > MAX_SUBJECT_LENGTH) {
    return NextResponse.json({ error: `Subject must be ${MAX_SUBJECT_LENGTH} characters or fewer` }, { status: 400 })
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json({ error: `Message must be ${MAX_MESSAGE_LENGTH} characters or fewer` }, { status: 400 })
  }

  // If an order/product is referenced, it must actually belong to this user
  // — otherwise a ticket could be used to probe or misattribute someone
  // else's order/product id.
  if (orderId) {
    const res = await query('SELECT 1 FROM orders WHERE id = $1 AND buyer_id = $2', [orderId, userId])
    if ((res.rowCount ?? 0) === 0) {
      return NextResponse.json({ error: 'That order does not belong to your account' }, { status: 403 })
    }
  }
  if (productId) {
    const res = await query(
      'SELECT 1 FROM products WHERE id = $1 AND (seller_id = $2 OR id IN (SELECT product_id FROM orders WHERE buyer_id = $2))',
      [productId, userId]
    )
    if ((res.rowCount ?? 0) === 0) {
      return NextResponse.json({ error: 'That product is not associated with your account' }, { status: 403 })
    }
  }

  const ticketId = await createTicket(userId, subject, message, { orderId, productId })
  return NextResponse.json({ ok: true, id: ticketId })
}
