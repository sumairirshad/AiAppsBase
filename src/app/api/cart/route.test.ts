import type { NextRequest } from 'next/server'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

const getSessionUserIdMock = vi.fn()
vi.mock('@/lib/session', () => ({ getSessionUserId: () => getSessionUserIdMock() }))

const queryMock = vi.fn()
vi.mock('@/lib/db', () => ({ query: (...args: unknown[]) => queryMock(...args) }))

const getCartMock = vi.fn()
vi.mock('@/lib/cart', () => ({ getCart: (...args: unknown[]) => getCartMock(...args) }))

const rateLimitMock = vi.fn()
vi.mock('@/lib/rate-limit', () => ({ rateLimit: (...args: unknown[]) => rateLimitMock(...args) }))

type Mod = typeof import('./route')
let POST: Mod['POST']
beforeAll(async () => {
  POST = (await import('./route')).POST
})

const USER_ID = 'buyer-1'
const PRODUCT_ID = 'product-1'
const SELLER_ID = 'seller-1'

function fakeRequest(body: unknown): NextRequest {
  return { json: async () => body, headers: new Headers() } as unknown as NextRequest
}

function call(body: unknown = { productId: PRODUCT_ID }) {
  return POST(fakeRequest(body))
}

beforeEach(() => {
  getSessionUserIdMock.mockReset()
  getSessionUserIdMock.mockResolvedValue(USER_ID)
  queryMock.mockReset()
  getCartMock.mockReset()
  getCartMock.mockResolvedValue({ items: [], count: 0, subtotal: 0 })
  rateLimitMock.mockReset()
  rateLimitMock.mockResolvedValue(null)
})

/** Queues the product lookup's response; a second queued response (the
 * ownership check) is set per-test since that's what each test exercises. */
function mockProductLookup(currentVersionId: string | null) {
  queryMock.mockResolvedValueOnce({ rows: [{ seller_id: SELLER_ID, current_version_id: currentVersionId }], rowCount: 1 })
}

describe('POST /api/cart — repurchase-aware ownership check', () => {
  it('blocks adding a product the buyer already owns at its current version', async () => {
    mockProductLookup('version-2')
    queryMock.mockResolvedValueOnce({ rows: [{ x: 1 }], rowCount: 1 }) // owns current version

    const res = await call()
    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body.error).toMatch(/already own the current version/i)

    // The ownership query must be version-aware, not a blanket "any order ever".
    expect(queryMock).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('product_version_id IS NOT DISTINCT FROM'),
      [PRODUCT_ID, USER_ID, 'version-2']
    )
  })

  it('allows re-adding a product the buyer owns at an OLDER version — this is the whole point of the fix', async () => {
    mockProductLookup('version-2')
    queryMock.mockResolvedValueOnce({ rows: [], rowCount: 0 }) // does not own current version
    queryMock.mockResolvedValueOnce({ rows: [], rowCount: 0 }) // the INSERT

    const res = await call()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
  })

  it('allows re-adding after the buyer\'s only order for this product was refunded', async () => {
    mockProductLookup('version-1')
    // The SQL itself filters to status = 'completed', so a refunded-only
    // buyer's ownership query returns nothing — simulated directly here.
    queryMock.mockResolvedValueOnce({ rows: [], rowCount: 0 })
    queryMock.mockResolvedValueOnce({ rows: [], rowCount: 0 }) // the INSERT

    const res = await call()
    expect(res.status).toBe(200)
  })

  it('is NULL-safe: blocks re-adding when the product has no resolved version and the buyer already owns it', async () => {
    mockProductLookup(null)
    queryMock.mockResolvedValueOnce({ rows: [{ x: 1 }], rowCount: 1 })

    const res = await call()
    expect(res.status).toBe(409)
    expect(queryMock).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('product_version_id IS NOT DISTINCT FROM'),
      [PRODUCT_ID, USER_ID, null]
    )
  })

  it('allows adding a never-purchased product with no resolved version', async () => {
    mockProductLookup(null)
    queryMock.mockResolvedValueOnce({ rows: [], rowCount: 0 })
    queryMock.mockResolvedValueOnce({ rows: [], rowCount: 0 }) // the INSERT

    const res = await call()
    expect(res.status).toBe(200)
  })
})
