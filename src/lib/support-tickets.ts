import { query } from '@/lib/db'

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed'
export const TICKET_STATUSES: TicketStatus[] = ['open', 'in_progress', 'resolved', 'closed']

export type TicketSummary = {
  id: string
  subject: string
  status: TicketStatus
  created_at: string
  updated_at: string
  order_id: string | null
  product_id: string | null
  product_title: string | null
  user_id: string
  user_name: string
  user_email: string
  reply_count: number
}

export type TicketReply = {
  id: string
  author_id: string
  author_name: string
  is_admin_reply: boolean
  message: string
  created_at: string
}

export type TicketDetail = TicketSummary & {
  message: string
  replies: TicketReply[]
}

function paginate(page = 1, pageSize = 20) {
  const safePage = Math.max(1, page)
  const safeSize = Math.min(100, Math.max(1, pageSize))
  return { limit: safeSize, offset: (safePage - 1) * safeSize }
}

const SUMMARY_SELECT = `
  SELECT t.id, t.subject, t.status, t.created_at, t.updated_at, t.order_id, t.product_id,
         p.title AS product_title,
         t.user_id, u.full_name AS user_name, u.email AS user_email,
         (SELECT COUNT(*)::int FROM support_ticket_replies r WHERE r.ticket_id = t.id) AS reply_count
  FROM support_tickets t
  JOIN users u ON t.user_id = u.id
  LEFT JOIN products p ON t.product_id = p.id
`

/** A user's own tickets, newest first. */
export async function listTicketsForUser(userId: string): Promise<TicketSummary[]> {
  const res = await query<TicketSummary>(`${SUMMARY_SELECT} WHERE t.user_id = $1 ORDER BY t.updated_at DESC`, [userId])
  return res.rows
}

/** Every ticket, for the admin queue — optionally filtered by status. */
export async function listTicketsForAdmin(opts: {
  status?: string
  page?: number
  pageSize?: number
}): Promise<{ tickets: TicketSummary[]; total: number }> {
  const conditions: string[] = []
  const params: unknown[] = []
  let idx = 1
  if (opts.status && opts.status !== 'all') {
    conditions.push(`t.status = $${idx++}`)
    params.push(opts.status)
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  const { limit, offset } = paginate(opts.page, opts.pageSize)

  const [rowsRes, countRes] = await Promise.all([
    query<TicketSummary>(
      `${SUMMARY_SELECT} ${where} ORDER BY t.updated_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, offset]
    ),
    query<{ total: number }>(`SELECT COUNT(*)::int AS total FROM support_tickets t ${where}`, params),
  ])
  return { tickets: rowsRes.rows, total: countRes.rows[0]?.total ?? 0 }
}

/** A single ticket with its full reply thread. Returns null if it doesn't exist.
 * Ownership (is this the caller's own ticket, or is the caller an admin) is the
 * route's responsibility, not this function's — see each route for its check. */
export async function getTicketWithReplies(ticketId: string): Promise<TicketDetail | null> {
  const ticketRes = await query<TicketSummary & { message: string }>(
    `${SUMMARY_SELECT} WHERE t.id = $1`,
    [ticketId]
  )
  if ((ticketRes.rowCount ?? 0) === 0) return null
  const ticket = ticketRes.rows[0]

  const repliesRes = await query<TicketReply>(
    `SELECT r.id, r.author_id, u.full_name AS author_name, r.is_admin_reply, r.message, r.created_at
     FROM support_ticket_replies r JOIN users u ON r.author_id = u.id
     WHERE r.ticket_id = $1 ORDER BY r.created_at ASC`,
    [ticketId]
  )

  return { ...ticket, replies: repliesRes.rows }
}

export async function createTicket(
  userId: string,
  subject: string,
  message: string,
  opts: { orderId?: string | null; productId?: string | null } = {}
): Promise<string> {
  const res = await query<{ id: string }>(
    `INSERT INTO support_tickets (user_id, subject, message, order_id, product_id)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [userId, subject, message, opts.orderId ?? null, opts.productId ?? null]
  )
  return res.rows[0].id
}

/**
 * Adds a reply to a ticket and bumps its status: a user's reply reopens a
 * resolved/closed ticket to 'open' (they're telling us it isn't actually
 * resolved), and an admin's reply on an 'open' ticket moves it to
 * 'in_progress' (someone is actively on it now). Returns false if the
 * ticket doesn't exist.
 */
export async function addTicketReply(
  ticketId: string,
  authorId: string,
  isAdminReply: boolean,
  message: string
): Promise<boolean> {
  const ticketRes = await query<{ status: TicketStatus }>('SELECT status FROM support_tickets WHERE id = $1', [ticketId])
  if ((ticketRes.rowCount ?? 0) === 0) return false

  await query(
    `INSERT INTO support_ticket_replies (ticket_id, author_id, is_admin_reply, message) VALUES ($1, $2, $3, $4)`,
    [ticketId, authorId, isAdminReply, message]
  )

  const currentStatus = ticketRes.rows[0].status
  let nextStatus: TicketStatus | null = null
  if (!isAdminReply && (currentStatus === 'resolved' || currentStatus === 'closed')) {
    nextStatus = 'open'
  } else if (isAdminReply && currentStatus === 'open') {
    nextStatus = 'in_progress'
  }

  await query(
    `UPDATE support_tickets SET updated_at = NOW()${nextStatus ? ', status = $2' : ''} WHERE id = $1`,
    nextStatus ? [ticketId, nextStatus] : [ticketId]
  )
  return true
}

export async function setTicketStatus(ticketId: string, status: TicketStatus): Promise<boolean> {
  const res = await query(
    `UPDATE support_tickets SET status = $1, updated_at = NOW() WHERE id = $2`,
    [status, ticketId]
  )
  return (res.rowCount ?? 0) > 0
}
