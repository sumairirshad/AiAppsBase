import type { NextRequest } from 'next/server'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

const requireAdminMock = vi.fn()
const isAdminGuardErrorMock = vi.fn((guard: unknown) => guard instanceof Response)
const getClientIpMock = vi.fn((_req: unknown) => null)
const logAdminActionMock = vi.fn()
vi.mock('@/lib/admin', () => ({
  requireAdmin: () => requireAdminMock(),
  isAdminGuardError: (guard: unknown) => isAdminGuardErrorMock(guard),
  getClientIp: (req: unknown) => getClientIpMock(req),
  logAdminAction: (entry: unknown) => logAdminActionMock(entry),
}))

const sendModerationDecisionEmailMock = vi.fn()
vi.mock('@/lib/email', () => ({
  sendModerationDecisionEmail: (...args: unknown[]) => sendModerationDecisionEmailMock(...args),
}))

const snapshotGithubRepoMock = vi.fn()
vi.mock('@/lib/github-snapshot', () => ({
  snapshotGithubRepo: (...args: unknown[]) => snapshotGithubRepoMock(...args),
}))

const queryMock = vi.fn()
vi.mock('@/lib/db', () => ({ query: (...args: unknown[]) => queryMock(...args) }))

type Mod = typeof import('./route')
let PATCH: Mod['PATCH']
beforeAll(async () => {
  PATCH = (await import('./route')).PATCH
})

const ADMIN = { id: 'admin-1', full_name: 'Admin', email: 'admin@example.com' }
const PRODUCT_ID = 'product-1'

function fakeRequest(body: unknown): NextRequest {
  return { json: async () => body, headers: new Headers() } as unknown as NextRequest
}

function call(body: unknown) {
  return PATCH(fakeRequest(body), { params: { id: PRODUCT_ID } })
}

function existingRow(overrides: Record<string, unknown> = {}) {
  return {
    id: PRODUCT_ID,
    title: 'Test product',
    status: 'pending',
    seller_id: 'seller-1',
    github_repo_name: null,
    github_default_branch: null,
    seller_email: 'seller@example.com',
    email_notifications_enabled: false,
    ...overrides,
  }
}

beforeEach(() => {
  requireAdminMock.mockReset().mockResolvedValue(ADMIN)
  getClientIpMock.mockReset().mockReturnValue(null)
  logAdminActionMock.mockReset().mockResolvedValue(undefined)
  sendModerationDecisionEmailMock.mockReset().mockResolvedValue(undefined)
  snapshotGithubRepoMock.mockReset()
  queryMock.mockReset()
})

describe('PATCH /api/admin/products/[id] — GitHub-sourced approval gate', () => {
  it('approves and snapshots a GitHub-sourced product only when the snapshot succeeds', async () => {
    queryMock
      .mockResolvedValueOnce({
        rows: [existingRow({ github_repo_name: 'seller/repo', github_default_branch: 'main' })],
        rowCount: 1,
      }) // SELECT existing
      .mockResolvedValueOnce({ rows: [], rowCount: 1 }) // UPDATE status

    snapshotGithubRepoMock.mockResolvedValue({
      ok: true, private: true, commitSha: 'sha1', remotePath: '/d/p.zip', sizeBytes: 123,
    })

    const res = await call({ status: 'approved', reason: 'looks good' })

    expect(snapshotGithubRepoMock).toHaveBeenCalledWith(PRODUCT_ID, 'seller-1', 'seller/repo', 'main')
    expect(res.status).toBe(200)
    // the status UPDATE must be the query right after the snapshot succeeded
    const updateCall = queryMock.mock.calls.find(([sql]) => sql.includes('UPDATE products SET status'))
    expect(updateCall?.[1]).toEqual(['approved', null, PRODUCT_ID])
  })

  it('refuses to approve when the snapshot fails, and never touches the product status', async () => {
    queryMock.mockResolvedValueOnce({
      rows: [existingRow({ github_repo_name: 'seller/repo', github_default_branch: 'main', status: 'pending' })],
      rowCount: 1,
    })

    snapshotGithubRepoMock.mockResolvedValue({ ok: false, error: 'Repository not found' })

    const res = await call({ status: 'approved', reason: 'looks good' })

    expect(res.status).toBe(502)
    const body = await res.json()
    expect(body.error).toMatch(/Repository not found/)
    expect(queryMock.mock.calls.some(([sql]) => sql.includes('UPDATE products SET status'))).toBe(false)
    expect(logAdminActionMock).not.toHaveBeenCalled()
  })

  it('does not attempt a snapshot for a manual-upload (non-GitHub) product', async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [existingRow({ github_repo_name: null })], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [], rowCount: 1 })

    const res = await call({ status: 'approved', reason: 'looks good' })

    expect(snapshotGithubRepoMock).not.toHaveBeenCalled()
    expect(res.status).toBe(200)
  })

  it('does not attempt a snapshot when rejecting a GitHub-sourced product', async () => {
    queryMock
      .mockResolvedValueOnce({
        rows: [existingRow({ github_repo_name: 'seller/repo', github_default_branch: 'main' })],
        rowCount: 1,
      })
      .mockResolvedValueOnce({ rows: [], rowCount: 1 })

    const res = await call({ status: 'rejected', reason: 'policy violation' })

    expect(snapshotGithubRepoMock).not.toHaveBeenCalled()
    expect(res.status).toBe(200)
  })
})
