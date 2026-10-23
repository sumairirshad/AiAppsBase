import { describe, it, expect, afterEach } from 'vitest'
import { isDatabaseConfigured, query } from './db'
import { createTestUser, cleanupTestUsers } from '@/test/db-test-helpers'
import {
  createTicket,
  listTicketsForUser,
  listTicketsForAdmin,
  getTicketWithReplies,
  addTicketReply,
  setTicketStatus,
} from './support-tickets'

describe.skipIf(!isDatabaseConfigured())('support-tickets', () => {
  const createdUserIds: string[] = []

  afterEach(async () => {
    await cleanupTestUsers(createdUserIds.splice(0))
  })

  it('creates a ticket and lists it for its owner, newest first', async () => {
    const buyer = await createTestUser({ role: 'buyer' })
    createdUserIds.push(buyer.id)

    const firstId = await createTicket(buyer.id, 'First issue', 'Something is wrong')
    const secondId = await createTicket(buyer.id, 'Second issue', 'Another thing')

    const tickets = await listTicketsForUser(buyer.id)
    expect(tickets.map((t) => t.id)).toEqual([secondId, firstId])
    expect(tickets[0].status).toBe('open')
    expect(tickets[0].reply_count).toBe(0)
  })

  it('does not list another user\'s tickets', async () => {
    const buyer = await createTestUser({ role: 'buyer' })
    const other = await createTestUser({ role: 'buyer' })
    createdUserIds.push(buyer.id, other.id)
    await createTicket(buyer.id, 'Private issue', 'Only mine')

    const otherTickets = await listTicketsForUser(other.id)
    expect(otherTickets).toHaveLength(0)
  })

  it('returns the full thread with getTicketWithReplies, in chronological order', async () => {
    const buyer = await createTestUser({ role: 'buyer' })
    const admin = await createTestUser({ role: 'admin' })
    createdUserIds.push(buyer.id, admin.id)
    const ticketId = await createTicket(buyer.id, 'Download broken', 'The download button does nothing')

    await addTicketReply(ticketId, admin.id, true, 'Looking into it now')
    await addTicketReply(ticketId, buyer.id, false, 'Thanks, let me know')

    const ticket = await getTicketWithReplies(ticketId)
    expect(ticket).not.toBeNull()
    expect(ticket!.subject).toBe('Download broken')
    expect(ticket!.replies).toHaveLength(2)
    expect(ticket!.replies[0]).toMatchObject({ is_admin_reply: true, message: 'Looking into it now' })
    expect(ticket!.replies[1]).toMatchObject({ is_admin_reply: false, message: 'Thanks, let me know' })
  })

  it('returns null for a ticket that does not exist', async () => {
    const ticket = await getTicketWithReplies('00000000-0000-0000-0000-000000000000')
    expect(ticket).toBeNull()
  })

  it('an admin reply on an open ticket moves it to in_progress', async () => {
    const buyer = await createTestUser({ role: 'buyer' })
    const admin = await createTestUser({ role: 'admin' })
    createdUserIds.push(buyer.id, admin.id)
    const ticketId = await createTicket(buyer.id, 'Issue', 'Details')

    await addTicketReply(ticketId, admin.id, true, 'We are on it')

    const row = await query<{ status: string }>('SELECT status FROM support_tickets WHERE id = $1', [ticketId])
    expect(row.rows[0].status).toBe('in_progress')
  })

  it('a user reply on a resolved ticket reopens it', async () => {
    const buyer = await createTestUser({ role: 'buyer' })
    createdUserIds.push(buyer.id)
    const ticketId = await createTicket(buyer.id, 'Issue', 'Details')
    await setTicketStatus(ticketId, 'resolved')

    await addTicketReply(ticketId, buyer.id, false, 'This is still happening')

    const row = await query<{ status: string }>('SELECT status FROM support_tickets WHERE id = $1', [ticketId])
    expect(row.rows[0].status).toBe('open')
  })

  it('a user reply on an already-open ticket does not change its status', async () => {
    const buyer = await createTestUser({ role: 'buyer' })
    createdUserIds.push(buyer.id)
    const ticketId = await createTicket(buyer.id, 'Issue', 'Details')

    await addTicketReply(ticketId, buyer.id, false, 'Adding more detail')

    const row = await query<{ status: string }>('SELECT status FROM support_tickets WHERE id = $1', [ticketId])
    expect(row.rows[0].status).toBe('open')
  })

  it('addTicketReply returns false for a nonexistent ticket', async () => {
    const buyer = await createTestUser({ role: 'buyer' })
    createdUserIds.push(buyer.id)
    const added = await addTicketReply('00000000-0000-0000-0000-000000000000', buyer.id, false, 'hi')
    expect(added).toBe(false)
  })

  it('listTicketsForAdmin filters by status and paginates across all users', async () => {
    const buyerA = await createTestUser({ role: 'buyer' })
    const buyerB = await createTestUser({ role: 'buyer' })
    createdUserIds.push(buyerA.id, buyerB.id)
    const openId = await createTicket(buyerA.id, 'Open one', 'x')
    const resolvedId = await createTicket(buyerB.id, 'Resolved one', 'y')
    await setTicketStatus(resolvedId, 'resolved')

    const { tickets: openOnly, total: openTotal } = await listTicketsForAdmin({ status: 'open' })
    expect(openOnly.some((t) => t.id === openId)).toBe(true)
    expect(openOnly.some((t) => t.id === resolvedId)).toBe(false)
    expect(openTotal).toBeGreaterThanOrEqual(1)

    const { tickets: all } = await listTicketsForAdmin({ status: 'all' })
    expect(all.some((t) => t.id === openId)).toBe(true)
    expect(all.some((t) => t.id === resolvedId)).toBe(true)
  })

  it('setTicketStatus returns false for a nonexistent ticket', async () => {
    const updated = await setTicketStatus('00000000-0000-0000-0000-000000000000', 'closed')
    expect(updated).toBe(false)
  })
})
