import type { NextRequest } from 'next/server'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

const getSessionUserIdMock = vi.fn()
vi.mock('@/lib/session', () => ({ getSessionUserId: () => getSessionUserIdMock() }))

const queryMock = vi.fn()
vi.mock('@/lib/db', () => ({ query: (...args: unknown[]) => queryMock(...args) }))

const createTicketMock = vi.fn()
const listTicketsForUserMock = vi.fn()
vi.mock('@/lib/support-tickets', () => ({
  createTicket: (...args: unknown[]) => createTicketMock(...args),
  listTicketsForUser: (...args: unknown[]) => listTicketsForUserMock(...args),
}))

const rateLimitMock = vi.fn()
vi.mock('@/lib/rate-limit', () => ({ rateLimit: (...args: unknown[]) => rateLimitMock(...args) }))

type Mod = typeof import('./route')
let POST: Mod['POST']
beforeAll(async () => {
  POST = (await import('./route')).POST
})

const USER_ID = 'user-1'

function fakeRequest(body: unknown): NextRequest {
  return { json: async () => body, headers: new Headers() } as unknown as NextRequest
}

beforeEach(() => {
  getSessionUserIdMock.mockReset()
  getSessionUserIdMock.mockResolvedValue(USER_ID)
  queryMock.mockReset()
  createTicketMock.mockReset()
  createTicketMock.mockResolvedValue('new-ticket-id')
  rateLimitMock.mockReset()
  rateLimitMock.mockResolvedValue(null)
})

describe('POST /api/support/tickets', () => {
  it('rejects a ticket referencing an order that does not belong to the caller', async () => {
    queryMock.mockResolvedValueOnce({ rows: [], rowCount: 0 }) // order ownership check fails

    const res = await POST(fakeRequest({ subject: 'Help', message: 'Please help', orderId: 'ORD-OTHER' }))
    expect(res.status).toBe(403)
    expect(createTicketMock).not.toHaveBeenCalled()
  })

  it('creates a ticket when the referenced order does belong to the caller', async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ x: 1 }], rowCount: 1 }) // order ownership check passes

    const res = await POST(fakeRequest({ subject: 'Help', message: 'Please help', orderId: 'ORD-MINE' }))
    expect(res.status).toBe(200)
    expect(createTicketMock).toHaveBeenCalledWith(USER_ID, 'Help', 'Please help', { orderId: 'ORD-MINE', productId: null })
  })

  it('rejects an empty subject or message', async () => {
    const res = await POST(fakeRequest({ subject: '', message: '' }))
    expect(res.status).toBe(400)
    expect(createTicketMock).not.toHaveBeenCalled()
  })

  it('creates a ticket with no order/product reference with no extra ownership query', async () => {
    const res = await POST(fakeRequest({ subject: 'Help', message: 'Please help' }))
    expect(res.status).toBe(200)
    expect(queryMock).not.toHaveBeenCalled()
    expect(createTicketMock).toHaveBeenCalledWith(USER_ID, 'Help', 'Please help', { orderId: null, productId: null })
  })
})
