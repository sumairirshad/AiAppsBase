import type { NextRequest } from 'next/server'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

const getSessionUserIdMock = vi.fn()
vi.mock('@/lib/session', () => ({ getSessionUserId: () => getSessionUserIdMock() }))

const queryMock = vi.fn()
vi.mock('@/lib/db', () => ({ query: (...args: unknown[]) => queryMock(...args) }))

const snapshotGithubRepoMock = vi.fn()
vi.mock('@/lib/github-snapshot', () => ({
  snapshotGithubRepo: (...args: unknown[]) => snapshotGithubRepoMock(...args),
}))

type Mod = typeof import('./route')
let POST: Mod['POST']
beforeAll(async () => {
  POST = (await import('./route')).POST
})

const USER_ID = 'seller-1'
const PRODUCT_ID = 'product-1'

function call() {
  const req = { headers: new Headers() } as unknown as NextRequest
  return POST(req, { params: { id: PRODUCT_ID } })
}

beforeEach(() => {
  getSessionUserIdMock.mockReset()
  getSessionUserIdMock.mockResolvedValue(USER_ID)
  queryMock.mockReset()
  snapshotGithubRepoMock.mockReset()
})

describe('POST /api/products/[id]/sync-github-snapshot — pending_reason', () => {
  it('sets pending_reason to content_updated when an approved listing is reset for re-review', async () => {
    queryMock.mockResolvedValueOnce({
      rows: [{ github_repo_name: 'seller/repo', github_default_branch: 'main', status: 'approved' }],
      rowCount: 1,
    })
    snapshotGithubRepoMock.mockResolvedValue({ ok: true, private: false, commitSha: 'abc123', sizeBytes: 100 })
    queryMock.mockResolvedValueOnce({ rows: [], rowCount: 1 }) // the UPDATE

    const res = await call()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.statusReset).toBe(true)

    expect(queryMock).toHaveBeenNthCalledWith(
      2,
      expect.stringMatching(/pending_reason = 'content_updated'/),
      [PRODUCT_ID, USER_ID]
    )
  })

  it('does not touch status or pending_reason when the listing was not approved yet', async () => {
    queryMock.mockResolvedValueOnce({
      rows: [{ github_repo_name: 'seller/repo', github_default_branch: 'main', status: 'pending' }],
      rowCount: 1,
    })
    snapshotGithubRepoMock.mockResolvedValue({ ok: true, private: false, commitSha: 'abc123', sizeBytes: 100 })

    const res = await call()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.statusReset).toBe(false)
    // Only the initial product lookup query should have run -- no UPDATE.
    expect(queryMock).toHaveBeenCalledTimes(1)
  })
})
