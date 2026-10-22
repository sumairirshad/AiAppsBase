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
  github_repo_name: string | null
  github_default_branch: string | null
  deliverable_remote_path: string | null
  deliverable_original_name: string | null
  seller_github_access_token: string | null
}

function orderRow(overrides: Partial<OrderRow> = {}): OrderRow {
  return {
    buyer_id: BUYER_ID,
    status: 'completed',
    github_repo_name: null,
    github_default_branch: null,
    deliverable_remote_path: null,
    deliverable_original_name: null,
    seller_github_access_token: null,
    ...overrides,
  }
}

function mockOrderLookup(row: OrderRow | null) {
  queryMock.mockResolvedValueOnce(row ? { rows: [row], rowCount: 1 } : { rows: [], rowCount: 0 })
}

function call() {
  return GET({} as NextRequest, { params: { id: ORDER_ID } })
}

function jsonRes(body: unknown, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body, text: async () => '' } as unknown as Response
}

function zipRes(status: number) {
  return { ok: status >= 200 && status < 300, status, body: status === 200 ? {} : null } as unknown as Response
}

beforeEach(() => {
  queryMock.mockReset()
  getSessionUserIdMock.mockReset()
  downloadDeliverableStreamMock.mockReset()
  decryptTokenMock.mockReset()
  vi.unstubAllGlobals()
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
    mockOrderLookup(orderRow({ deliverable_remote_path: '/deliverables/p1/file.zip' }))
    const res = await call()
    expect(res.status).toBe(403)
    expect(downloadDeliverableStreamMock).not.toHaveBeenCalled()
  })

  it('refuses a download for an order that never completed', async () => {
    getSessionUserIdMock.mockResolvedValue(BUYER_ID)
    mockOrderLookup(orderRow({ status: 'pending', deliverable_remote_path: '/deliverables/p1/file.zip' }))
    const res = await call()
    expect(res.status).toBe(400)
  })
})

describe('GET /api/orders/[id]/download — snapshot-backed deliverable (primary path)', () => {
  it('streams a snapshotted PRIVATE repo product straight from storage — no GitHub call, no buyer GitHub identity involved', async () => {
    getSessionUserIdMock.mockResolvedValue(BUYER_ID)
    mockOrderLookup(orderRow({
      github_repo_name: 'seller/private-repo',
      github_default_branch: 'main',
      deliverable_remote_path: '/deliverables/p1/private-repo-main.zip',
      deliverable_original_name: 'private-repo-main.zip',
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
  })

  it('streams a snapshotted PUBLIC repo product identically', async () => {
    getSessionUserIdMock.mockResolvedValue(BUYER_ID)
    mockOrderLookup(orderRow({
      github_repo_name: 'seller/public-repo',
      github_default_branch: 'main',
      deliverable_remote_path: '/deliverables/p2/public-repo-main.zip',
      deliverable_original_name: 'public-repo-main.zip',
    }))
    downloadDeliverableStreamMock.mockResolvedValue({ stream: Readable.from(Buffer.from('public-zip')), size: 10 })
    vi.stubGlobal('fetch', vi.fn())

    const res = await call()
    expect(res.status).toBe(200)
    expect(await res.text()).toBe('public-zip')
  })

  it('streams a manual-upload (non-GitHub) product the same way', async () => {
    getSessionUserIdMock.mockResolvedValue(BUYER_ID)
    mockOrderLookup(orderRow({
      deliverable_remote_path: '/deliverables/p3/upload.zip',
      deliverable_original_name: 'upload.zip',
    }))
    downloadDeliverableStreamMock.mockResolvedValue({ stream: Readable.from(Buffer.from('manual-zip')), size: 10 })

    const res = await call()
    expect(res.status).toBe(200)
    expect(await res.text()).toBe('manual-zip')
  })

  it('returns a clean 502 (not a raw filesystem error) when storage is unreachable', async () => {
    getSessionUserIdMock.mockResolvedValue(BUYER_ID)
    mockOrderLookup(orderRow({ deliverable_remote_path: '/deliverables/p1/file.zip' }))
    downloadDeliverableStreamMock.mockRejectedValue(new Error('ECONNREFUSED'))

    const res = await call()
    expect(res.status).toBe(502)
  })
})

describe('GET /api/orders/[id]/download — legacy pre-snapshot GitHub products', () => {
  it('falls back to a live authenticated fetch when no snapshot exists yet', async () => {
    getSessionUserIdMock.mockResolvedValue(BUYER_ID)
    mockOrderLookup(orderRow({
      github_repo_name: 'seller/legacy-private',
      github_default_branch: 'main',
      seller_github_access_token: 'encrypted',
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
    mockOrderLookup(orderRow({
      github_repo_name: 'seller/legacy-public',
      github_default_branch: 'main',
      seller_github_access_token: null,
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
    mockOrderLookup(orderRow({
      github_repo_name: 'seller/broken',
      github_default_branch: 'main',
      seller_github_access_token: 'encrypted',
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
  it('404s when the product has neither a snapshot nor a GitHub repo configured', async () => {
    getSessionUserIdMock.mockResolvedValue(BUYER_ID)
    mockOrderLookup(orderRow())
    const res = await call()
    expect(res.status).toBe(404)
  })
})
