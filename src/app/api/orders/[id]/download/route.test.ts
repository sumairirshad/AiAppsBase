import type { NextRequest } from 'next/server'
import { Readable } from 'stream'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

const getSessionUserIdMock = vi.fn()
vi.mock('@/lib/session', () => ({ getSessionUserId: (...args: unknown[]) => getSessionUserIdMock(...args) }))

const queryMock = vi.fn()
vi.mock('@/lib/db', () => ({ query: (...args: unknown[]) => queryMock(...args) }))

const downloadDeliverableStreamMock = vi.fn()
vi.mock('@/lib/sftp', () => ({
  downloadDeliverableStream: (...args: unknown[]) => downloadDeliverableStreamMock(...args),
}))

const decryptTokenMock = vi.fn()
vi.mock('@/lib/token-crypto', () => ({ decryptToken: (...args: unknown[]) => decryptTokenMock(...args) }))

const rateLimitMock = vi.fn()
vi.mock('@/lib/rate-limit', () => ({ rateLimit: (...args: unknown[]) => rateLimitMock(...args) }))

const resolveOrderDeliverableMock = vi.fn()
vi.mock('@/lib/product-versions', () => ({
  resolveOrderDeliverable: (...args: unknown[]) => resolveOrderDeliverableMock(...args),
}))

type Mod = typeof import('./route')
let GET: Mod['GET']
beforeAll(async () => {
  GET = (await import('./route')).GET
})

const ORDER_ID = 'order-1'
const BUYER_ID = 'buyer-1'

type OrderRow = {
  buyer_id: string
  status: string
  product_id: string
  product_version_id: string | null
  seller_github_access_token: string | null
}

function orderRow(overrides: Partial<OrderRow> = {}): OrderRow {
  return {
    buyer_id: BUYER_ID,
    status: 'completed',
    product_id: 'product-1',
    product_version_id: 'version-1',
    seller_github_access_token: null,
    ...overrides,
  }
}

function mockOrderLookup(row: OrderRow | null) {
  queryMock.mockResolvedValueOnce(row ? { rows: [row], rowCount: 1 } : { rows: [], rowCount: 0 })
}

type Deliverable = {
  deliveryType: 'upload' | 'github'
  deliverableRemotePath: string | null
  deliverableOriginalName: string | null
  githubRepoName: string | null
  githubBranch: string | null
  githubCommitSha: string | null
}

function deliverable(overrides: Partial<Deliverable> = {}): Deliverable {
  return {
    deliveryType: 'upload',
    deliverableRemotePath: null,
    deliverableOriginalName: null,
    githubRepoName: null,
    githubBranch: null,
    githubCommitSha: null,
    ...overrides,
  }
}

function call() {
  return GET({ headers: new Headers() } as NextRequest, { params: { id: ORDER_ID } })
}

function zipRes(status: number) {
  return { ok: status >= 200 && status < 300, status, body: status === 200 ? {} : null } as unknown as Response
}

beforeEach(() => {
  queryMock.mockReset()
  getSessionUserIdMock.mockReset()
  downloadDeliverableStreamMock.mockReset()
  decryptTokenMock.mockReset()
  rateLimitMock.mockReset()
  rateLimitMock.mockResolvedValue(null)
  resolveOrderDeliverableMock.mockReset()
  resolveOrderDeliverableMock.mockResolvedValue(null)
  vi.unstubAllGlobals()
})

describe('GET /api/orders/[id]/download — rate limiting', () => {
  it('returns the rate limiter response as-is once the caller is over the limit, before anything else runs', async () => {
    const limited = new Response(JSON.stringify({ error: 'Too many requests.' }), { status: 429 })
    rateLimitMock.mockResolvedValue(limited)

    const res = await call()
    expect(res.status).toBe(429)
    expect(getSessionUserIdMock).not.toHaveBeenCalled()
  })
})

describe('GET /api/orders/[id]/download — authorization', () => {
  it('rejects an unauthenticated request before touching the database', async () => {
    getSessionUserIdMock.mockResolvedValue(null)
    const res = await call()
    expect(res.status).toBe(401)
    expect(queryMock).not.toHaveBeenCalled()
  })

  it('404s when the order does not exist', async () => {
    getSessionUserIdMock.mockResolvedValue(BUYER_ID)
    mockOrderLookup(null)
    const res = await call()
    expect(res.status).toBe(404)
  })

  it('refuses a buyer trying to download an order that is not theirs — never a GitHub detail leaks a different outcome', async () => {
    getSessionUserIdMock.mockResolvedValue('someone-else')
    mockOrderLookup(orderRow())
    const res = await call()
    expect(res.status).toBe(403)
    expect(resolveOrderDeliverableMock).not.toHaveBeenCalled()
    expect(downloadDeliverableStreamMock).not.toHaveBeenCalled()
  })

  it('refuses a download for an order that never completed', async () => {
    getSessionUserIdMock.mockResolvedValue(BUYER_ID)
    mockOrderLookup(orderRow({ status: 'pending' }))
    const res = await call()
    expect(res.status).toBe(400)
    expect(resolveOrderDeliverableMock).not.toHaveBeenCalled()
  })
})

describe('GET /api/orders/[id]/download — snapshot-backed deliverable (primary path)', () => {
  it('streams a snapshotted PRIVATE repo product straight from storage — no GitHub call, no buyer GitHub identity involved', async () => {
    getSessionUserIdMock.mockResolvedValue(BUYER_ID)
    mockOrderLookup(orderRow())
    resolveOrderDeliverableMock.mockResolvedValue(deliverable({
      deliveryType: 'github',
      githubRepoName: 'seller/private-repo',
      githubBranch: 'main',
      deliverableRemotePath: '/deliverables/p1/private-repo-main.zip',
      deliverableOriginalName: 'private-repo-main.zip',
    }))
    downloadDeliverableStreamMock.mockResolvedValue({ stream: Readable.from(Buffer.from('zip-bytes')), size: 9 })
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const res = await call()

    expect(res.status).toBe(200)
    expect(await res.text()).toBe('zip-bytes')
    expect(res.headers.get('Content-Disposition')).toContain('private-repo-main.zip')
    // the whole point of snapshotting: a private-repo download never calls GitHub at request time
    expect(fetchMock).not.toHaveBeenCalled()
    // the exact version the buyer purchased, never just "the product's current version"
    expect(resolveOrderDeliverableMock).toHaveBeenCalledWith('product-1', 'version-1')
  })

  it('streams a snapshotted PUBLIC repo product identically', async () => {
    getSessionUserIdMock.mockResolvedValue(BUYER_ID)
    mockOrderLookup(orderRow())
    resolveOrderDeliverableMock.mockResolvedValue(deliverable({
      deliveryType: 'github',
      githubRepoName: 'seller/public-repo',
      githubBranch: 'main',
      deliverableRemotePath: '/deliverables/p2/public-repo-main.zip',
      deliverableOriginalName: 'public-repo-main.zip',
    }))
    downloadDeliverableStreamMock.mockResolvedValue({ stream: Readable.from(Buffer.from('public-zip')), size: 10 })
    vi.stubGlobal('fetch', vi.fn())

    const res = await call()
    expect(res.status).toBe(200)
    expect(await res.text()).toBe('public-zip')
  })

  it('streams a manual-upload (non-GitHub) product the same way', async () => {
    getSessionUserIdMock.mockResolvedValue(BUYER_ID)
    mockOrderLookup(orderRow())
    resolveOrderDeliverableMock.mockResolvedValue(deliverable({
      deliverableRemotePath: '/deliverables/p3/upload.zip',
      deliverableOriginalName: 'upload.zip',
    }))
    downloadDeliverableStreamMock.mockResolvedValue({ stream: Readable.from(Buffer.from('manual-zip')), size: 10 })

    const res = await call()
    expect(res.status).toBe(200)
    expect(await res.text()).toBe('manual-zip')
  })

  it('returns a clean 502 (not a raw filesystem error) when storage is unreachable', async () => {
    getSessionUserIdMock.mockResolvedValue(BUYER_ID)
    mockOrderLookup(orderRow())
    resolveOrderDeliverableMock.mockResolvedValue(deliverable({ deliverableRemotePath: '/deliverables/p1/file.zip' }))
    downloadDeliverableStreamMock.mockRejectedValue(new Error('ECONNREFUSED'))

    const res = await call()
    expect(res.status).toBe(502)
  })
})

describe('GET /api/orders/[id]/download — legacy pre-snapshot GitHub products', () => {
  it('falls back to a live authenticated fetch when no snapshot exists yet', async () => {
    getSessionUserIdMock.mockResolvedValue(BUYER_ID)
    mockOrderLookup(orderRow({ seller_github_access_token: 'encrypted' }))
    resolveOrderDeliverableMock.mockResolvedValue(deliverable({
      deliveryType: 'github',
      githubRepoName: 'seller/legacy-private',
      githubBranch: 'main',
    }))
    decryptTokenMock.mockReturnValue('seller-token')
    const fetchMock = vi.fn().mockResolvedValueOnce(zipRes(200))
    vi.stubGlobal('fetch', fetchMock)

    const res = await call()
    expect(res.status).toBe(200)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect((fetchMock.mock.calls[0][1] as RequestInit).headers).toMatchObject({ Authorization: 'Bearer seller-token' })
  })

  it('falls back to a public fetch when there is no usable seller token', async () => {
    getSessionUserIdMock.mockResolvedValue(BUYER_ID)
    mockOrderLookup(orderRow({ seller_github_access_token: null }))
    resolveOrderDeliverableMock.mockResolvedValue(deliverable({
      deliveryType: 'github',
      githubRepoName: 'seller/legacy-public',
      githubBranch: 'main',
    }))
    decryptTokenMock.mockReturnValue(null)
    const fetchMock = vi.fn().mockResolvedValueOnce(zipRes(200))
    vi.stubGlobal('fetch', fetchMock)

    const res = await call()
    expect(res.status).toBe(200)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0][0]).toContain('archive/refs/heads')
  })

  it('never redirects a buyer to a raw GitHub URL when every fetch path fails — returns a clear in-app error instead', async () => {
    getSessionUserIdMock.mockResolvedValue(BUYER_ID)
    mockOrderLookup(orderRow({ seller_github_access_token: 'encrypted' }))
    resolveOrderDeliverableMock.mockResolvedValue(deliverable({
      deliveryType: 'github',
      githubRepoName: 'seller/broken',
      githubBranch: 'main',
    }))
    decryptTokenMock.mockReturnValue('stale-token')
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(zipRes(401)) // authenticated attempt: token revoked
      .mockResolvedValueOnce(zipRes(404)) // public fallback: actually private
    vi.stubGlobal('fetch', fetchMock)

    const res = await call()
    expect(res.status).toBe(502)
    expect(res.headers.get('location')).toBeNull()
    const body = await res.json()
    expect(body.error).toMatch(/reconnect/i)
  })
})

describe('GET /api/orders/[id]/download — nothing to deliver', () => {
  it('404s when the resolved version has neither a snapshot nor a GitHub repo', async () => {
    getSessionUserIdMock.mockResolvedValue(BUYER_ID)
    mockOrderLookup(orderRow())
    resolveOrderDeliverableMock.mockResolvedValue(deliverable())
    const res = await call()
    expect(res.status).toBe(404)
  })

  it('404s when the order has no resolvable deliverable at all (e.g. the product itself was deleted)', async () => {
    getSessionUserIdMock.mockResolvedValue(BUYER_ID)
    mockOrderLookup(orderRow())
    resolveOrderDeliverableMock.mockResolvedValue(null)
    const res = await call()
    expect(res.status).toBe(404)
  })
})
