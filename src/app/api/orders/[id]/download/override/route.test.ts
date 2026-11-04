import type { NextRequest } from 'next/server'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

const getSessionUserIdMock = vi.fn()
vi.mock('@/lib/session', () => ({ getSessionUserId: (...args: unknown[]) => getSessionUserIdMock(...args) }))

const queryMock = vi.fn()
vi.mock('@/lib/db', () => ({ query: (...args: unknown[]) => queryMock(...args) }))

const rateLimitMock = vi.fn()
vi.mock('@/lib/rate-limit', () => ({ rateLimit: (...args: unknown[]) => rateLimitMock(...args) }))

const verifyPasswordMock = vi.fn()
vi.mock('@/lib/auth', () => ({ verifyPassword: (...args: unknown[]) => verifyPasswordMock(...args) }))

const resolveOrderDeliverableMock = vi.fn()
vi.mock('@/lib/product-versions', () => ({
  resolveOrderDeliverable: (...args: unknown[]) => resolveOrderDeliverableMock(...args),
}))

const streamResolvedDeliverableMock = vi.fn()
vi.mock('@/lib/deliverable-stream', () => ({
  streamResolvedDeliverable: (...args: unknown[]) => streamResolvedDeliverableMock(...args),
}))

const requestDownloadOverrideOtpMock = vi.fn()
const verifyDownloadOverrideOtpMock = vi.fn()
vi.mock('@/lib/download-override', () => ({
  requestDownloadOverrideOtp: (...args: unknown[]) => requestDownloadOverrideOtpMock(...args),
  verifyDownloadOverrideOtp: (...args: unknown[]) => verifyDownloadOverrideOtpMock(...args),
}))

type Mod = typeof import('./route')
let POST: Mod['POST']
beforeAll(async () => {
  POST = (await import('./route')).POST
})

const ORDER_ID = 'order-1'
const BUYER_ID = 'buyer-1'

function orderRow(overrides: Record<string, unknown> = {}) {
  return {
    buyer_id: BUYER_ID,
    status: 'completed',
    product_id: 'product-1',
    product_version_id: 'version-1',
    seller_id: 'seller-1',
    seller_github_access_token: null,
    buyer_email: 'buyer@example.com',
    buyer_password_hash: 'hashed',
    ...overrides,
  }
}

function mockOrderLookup(row: ReturnType<typeof orderRow> | null) {
  queryMock.mockResolvedValueOnce(row ? { rows: [row], rowCount: 1 } : { rows: [], rowCount: 0 })
}

function deliverable(overrides: Record<string, unknown> = {}) {
  return {
    productVersionId: 'version-1',
    deliverableOriginalName: 'file.zip',
    deliverableSha256: 'abc',
    deliverableSizeBytes: 10,
    scanStatus: 'infected',
    ...overrides,
  }
}

function call(body: unknown) {
  return POST(
    { headers: new Headers(), json: async () => body } as unknown as NextRequest,
    { params: { id: ORDER_ID } }
  )
}

beforeEach(() => {
  queryMock.mockReset()
  getSessionUserIdMock.mockReset()
  getSessionUserIdMock.mockResolvedValue(BUYER_ID)
  rateLimitMock.mockReset()
  rateLimitMock.mockResolvedValue(null)
  verifyPasswordMock.mockReset()
  resolveOrderDeliverableMock.mockReset()
  resolveOrderDeliverableMock.mockResolvedValue(deliverable())
  streamResolvedDeliverableMock.mockReset()
  requestDownloadOverrideOtpMock.mockReset()
  verifyDownloadOverrideOtpMock.mockReset()
})

describe('POST /api/orders/[id]/download/override', () => {
  it('rejects when the file is not actually flagged — this is not a general-purpose download bypass', async () => {
    mockOrderLookup(orderRow())
    resolveOrderDeliverableMock.mockResolvedValue(deliverable({ scanStatus: 'clean' }))

    const res = await call({ step: 'confirm', password: 'x', code: '123456' })
    expect(res.status).toBe(400)
    expect(verifyPasswordMock).not.toHaveBeenCalled()
  })

  it('request_code: sends the OTP and never streams anything', async () => {
    mockOrderLookup(orderRow())
    requestDownloadOverrideOtpMock.mockResolvedValue({ ok: true })

    const res = await call({ step: 'request_code' })
    expect(res.status).toBe(200)
    expect(requestDownloadOverrideOtpMock).toHaveBeenCalledWith(BUYER_ID, 'buyer@example.com')
    expect(streamResolvedDeliverableMock).not.toHaveBeenCalled()
  })

  it('confirm: blocks on a wrong password without ever checking the OTP code', async () => {
    mockOrderLookup(orderRow())
    verifyPasswordMock.mockResolvedValue(false)

    const res = await call({ step: 'confirm', password: 'wrong', code: '123456' })
    expect(res.status).toBe(400)
    expect(verifyDownloadOverrideOtpMock).not.toHaveBeenCalled()
    expect(streamResolvedDeliverableMock).not.toHaveBeenCalled()
  })

  it('confirm: blocks on a wrong/expired code even with the correct password', async () => {
    mockOrderLookup(orderRow())
    verifyPasswordMock.mockResolvedValue(true)
    verifyDownloadOverrideOtpMock.mockResolvedValue({ ok: false, reason: 'invalid', message: 'Invalid code' })

    const res = await call({ step: 'confirm', password: 'correct', code: 'wrong' })
    expect(res.status).toBe(400)
    expect(streamResolvedDeliverableMock).not.toHaveBeenCalled()
  })

  it('confirm: streams the file only once both password and emailed code are verified', async () => {
    mockOrderLookup(orderRow())
    verifyPasswordMock.mockResolvedValue(true)
    verifyDownloadOverrideOtpMock.mockResolvedValue({ ok: true })
    streamResolvedDeliverableMock.mockResolvedValue(new Response('bytes', { status: 200 }))

    const res = await call({ step: 'confirm', password: 'correct', code: '123456' })
    expect(res.status).toBe(200)
    expect(streamResolvedDeliverableMock).toHaveBeenCalledTimes(1)
  })

  it('404s when the order does not exist', async () => {
    mockOrderLookup(null)
    const res = await call({ step: 'request_code' })
    expect(res.status).toBe(404)
  })

  it('403s when the order is not the caller\'s own', async () => {
    mockOrderLookup(orderRow({ buyer_id: 'someone-else' }))
    const res = await call({ step: 'request_code' })
    expect(res.status).toBe(403)
  })
})
