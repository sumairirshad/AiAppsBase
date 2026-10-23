import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

const getSessionUserIdMock = vi.fn()
vi.mock('@/lib/session', () => ({ getSessionUserId: () => getSessionUserIdMock() }))

const getTicketWithRepliesMock = vi.fn()
vi.mock('@/lib/support-tickets', () => ({
  getTicketWithReplies: (...args: unknown[]) => getTicketWithRepliesMock(...args),
}))

type Mod = typeof import('./route')
let GET: Mod['GET']
beforeAll(async () => {
  GET = (await import('./route')).GET
})

beforeEach(() => {
  getSessionUserIdMock.mockReset()
  getTicketWithRepliesMock.mockReset()
})

function call() {
  return GET({} as Request, { params: { id: 'ticket-1' } })
}

describe('GET /api/support/tickets/[id] — IDOR protection', () => {
  it('rejects an unauthenticated request before loading the ticket', async () => {
    getSessionUserIdMock.mockResolvedValue(null)
    const res = await call()
    expect(res.status).toBe(401)
    expect(getTicketWithRepliesMock).not.toHaveBeenCalled()
  })

  it('404s when the ticket does not exist', async () => {
    getSessionUserIdMock.mockResolvedValue('user-1')
    getTicketWithRepliesMock.mockResolvedValue(null)
    const res = await call()
    expect(res.status).toBe(404)
  })

  it('refuses a user viewing a ticket that is not theirs', async () => {
    getSessionUserIdMock.mockResolvedValue('user-1')
    getTicketWithRepliesMock.mockResolvedValue({ id: 'ticket-1', user_id: 'someone-else', replies: [] })
    const res = await call()
    expect(res.status).toBe(403)
  })

  it('returns the ticket for its own owner', async () => {
    getSessionUserIdMock.mockResolvedValue('user-1')
    getTicketWithRepliesMock.mockResolvedValue({ id: 'ticket-1', user_id: 'user-1', replies: [] })
    const res = await call()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ticket.id).toBe('ticket-1')
  })
})
