import { describe, it, expect, beforeEach, vi } from 'vitest'

const queryMock = vi.fn()
vi.mock('@/lib/db', () => ({ query: (...args: unknown[]) => queryMock(...args) }))

const decryptTokenMock = vi.fn()
vi.mock('@/lib/token-crypto', () => ({ decryptToken: (...args: unknown[]) => decryptTokenMock(...args) }))

const uploadDeliverableMock = vi.fn()
const deleteDeliverableMock = vi.fn()
vi.mock('@/lib/sftp', () => ({
  uploadDeliverable: (...args: unknown[]) => uploadDeliverableMock(...args),
  deleteDeliverable: (...args: unknown[]) => deleteDeliverableMock(...args),
}))

import { verifyGithubRepoAccess, snapshotGithubRepo } from './github-snapshot'

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as unknown as Response
}

function zipResponse(status: number, bytes?: Uint8Array): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    body: status >= 200 && status < 300 ? {} : null,
    arrayBuffer: async () => (bytes ?? new Uint8Array([1, 2, 3])).buffer,
  } as unknown as Response
}

/** Routes queryMock calls by matching on the SQL text, independent of call order. */
function wireQueryMock(opts: {
  accessToken?: string | null
  previousRemotePath?: string | null
} = {}) {
  const failureUpdates: unknown[][] = []
  const successUpdates: unknown[][] = []

  queryMock.mockImplementation((sql: string, params: unknown[]) => {
    if (sql.includes('SELECT github_access_token')) {
      return Promise.resolve({ rows: [{ github_access_token: 'encrypted-placeholder' }], rowCount: 1 })
    }
    if (sql.includes('SELECT deliverable_remote_path FROM products')) {
      return Promise.resolve({ rows: [{ deliverable_remote_path: opts.previousRemotePath ?? null }], rowCount: 1 })
    }
    if (sql.includes("github_snapshot_status = 'failed'")) {
      failureUpdates.push(params)
      return Promise.resolve({ rows: [], rowCount: 1 })
    }
    if (sql.includes("github_snapshot_status = 'ready'")) {
      successUpdates.push(params)
      return Promise.resolve({ rows: [], rowCount: 1 })
    }
    throw new Error(`Unexpected query in test: ${sql}`)
  })

  decryptTokenMock.mockReturnValue(opts.accessToken === undefined ? 'decrypted-token' : opts.accessToken)

  return { failureUpdates, successUpdates }
}

describe('verifyGithubRepoAccess', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('fails closed when there is no access token', async () => {
    const result = await verifyGithubRepoAccess(null, 'octocat/hello', 'main')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toMatch(/GitHub connection is missing/i)
  })

  it('reports repo not found / inaccessible on a 404', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(jsonResponse({}, 404))
    vi.stubGlobal('fetch', fetchMock)

    const result = await verifyGithubRepoAccess('token', 'octocat/missing', 'main')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toMatch(/not found/i)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('reports a revoked/insufficient-scope token on a 403', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(jsonResponse({}, 403))
    vi.stubGlobal('fetch', fetchMock)

    const result = await verifyGithubRepoAccess('token', 'octocat/private-repo', 'main')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toMatch(/no longer has access/i)
  })

  it('reports a missing branch separately from a missing repo', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ private: true }, 200))
      .mockResolvedValueOnce(jsonResponse({}, 404))
    vi.stubGlobal('fetch', fetchMock)

    const result = await verifyGithubRepoAccess('token', 'octocat/hello', 'renamed-branch')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toMatch(/Branch "renamed-branch"/)
  })

  it('succeeds and reports visibility + branch sha for a reachable public repo', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ private: false }, 200))
      .mockResolvedValueOnce(jsonResponse({ commit: { sha: 'abc123' } }, 200))
    vi.stubGlobal('fetch', fetchMock)

    const result = await verifyGithubRepoAccess('token', 'octocat/hello', 'main')
    expect(result).toEqual({ ok: true, private: false, branchSha: 'abc123' })
  })

  it('succeeds for a private repo the token can see', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ private: true }, 200))
      .mockResolvedValueOnce(jsonResponse({ commit: { sha: 'def456' } }, 200))
    vi.stubGlobal('fetch', fetchMock)

    const result = await verifyGithubRepoAccess('token', 'octocat/secret', 'main')
    expect(result).toEqual({ ok: true, private: true, branchSha: 'def456' })
  })

  it('fails closed on a network error instead of throwing', async () => {
    const fetchMock = vi.fn().mockRejectedValueOnce(new Error('getaddrinfo ENOTFOUND api.github.com'))
    vi.stubGlobal('fetch', fetchMock)

    const result = await verifyGithubRepoAccess('token', 'octocat/hello', 'main')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toMatch(/Could not reach GitHub/)
  })
})

describe('snapshotGithubRepo', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    queryMock.mockReset()
    decryptTokenMock.mockReset()
    uploadDeliverableMock.mockReset()
    deleteDeliverableMock.mockReset()
    deleteDeliverableMock.mockResolvedValue(undefined)
  })

  it('does not store or mark ready when the seller has no usable GitHub token (buyer-independent failure)', async () => {
    const { failureUpdates } = wireQueryMock({ accessToken: null })
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const result = await snapshotGithubRepo('product-1', 'seller-1', 'octocat/hello', 'main')

    expect(result.ok).toBe(false)
    expect(uploadDeliverableMock).not.toHaveBeenCalled()
    expect(fetchMock).not.toHaveBeenCalled()
    expect(failureUpdates).toHaveLength(1)
    expect(failureUpdates[0]).toEqual(['Your GitHub connection is missing or invalid. Reconnect GitHub in your seller panel and try again.', 'product-1'])
  })

  it('does not store or mark ready when the repo/branch cannot be verified', async () => {
    const { failureUpdates } = wireQueryMock()
    const fetchMock = vi.fn().mockResolvedValueOnce(jsonResponse({}, 404))
    vi.stubGlobal('fetch', fetchMock)

    const result = await snapshotGithubRepo('product-1', 'seller-1', 'octocat/missing', 'main')

    expect(result.ok).toBe(false)
    expect(uploadDeliverableMock).not.toHaveBeenCalled()
    expect(failureUpdates).toHaveLength(1)
  })

  it('does not store or mark ready when the zipball fetch fails after a retry', async () => {
    const { failureUpdates } = wireQueryMock()
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ private: true }, 200)) // repo check
      .mockResolvedValueOnce(jsonResponse({ commit: { sha: 'sha1' } }, 200)) // branch check
      .mockResolvedValueOnce(zipResponse(500)) // zipball attempt 1 (transient, retried)
      .mockResolvedValueOnce(zipResponse(500)) // zipball attempt 2 (still failing)
    vi.stubGlobal('fetch', fetchMock)

    const result = await snapshotGithubRepo('product-1', 'seller-1', 'octocat/hello', 'main')

    expect(result.ok).toBe(false)
    expect(fetchMock).toHaveBeenCalledTimes(4)
    expect(uploadDeliverableMock).not.toHaveBeenCalled()
    expect(failureUpdates).toHaveLength(1)
  })

  it('does not retry a 404 zipball response (not transient)', async () => {
    wireQueryMock()
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ private: false }, 200))
      .mockResolvedValueOnce(jsonResponse({ commit: { sha: 'sha1' } }, 200))
      .mockResolvedValueOnce(zipResponse(404))
    vi.stubGlobal('fetch', fetchMock)

    const result = await snapshotGithubRepo('product-1', 'seller-1', 'octocat/hello', 'main')

    expect(result.ok).toBe(false)
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it('does not mark ready when the archive downloads but storage fails, and leaves the existing deliverable alone', async () => {
    const { failureUpdates, successUpdates } = wireQueryMock({ previousRemotePath: '/old/path.zip' })
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ private: false }, 200))
      .mockResolvedValueOnce(jsonResponse({ commit: { sha: 'sha1' } }, 200))
      .mockResolvedValueOnce(zipResponse(200))
    vi.stubGlobal('fetch', fetchMock)
    uploadDeliverableMock.mockRejectedValueOnce(new Error('SFTP connection refused'))

    const result = await snapshotGithubRepo('product-1', 'seller-1', 'octocat/hello', 'main')

    expect(result.ok).toBe(false)
    expect(successUpdates).toHaveLength(0)
    expect(failureUpdates).toHaveLength(1)
    expect(deleteDeliverableMock).not.toHaveBeenCalled()
  })

  it('stores the archive and marks ready only after a successful fetch + upload, then cleans up the old file', async () => {
    const { successUpdates } = wireQueryMock({ previousRemotePath: '/old/path.zip' })
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ private: true }, 200))
      .mockResolvedValueOnce(jsonResponse({ commit: { sha: 'sha-new' } }, 200))
      .mockResolvedValueOnce(zipResponse(200, new Uint8Array([9, 9, 9, 9])))
    vi.stubGlobal('fetch', fetchMock)
    uploadDeliverableMock.mockResolvedValueOnce({ remotePath: '/new/path.zip' })

    const result = await snapshotGithubRepo('product-1', 'seller-1', 'octocat/secret', 'main')

    expect(result).toEqual({ ok: true, private: true, commitSha: 'sha-new', remotePath: '/new/path.zip', sizeBytes: 4 })
    expect(successUpdates).toHaveLength(1)
    expect(deleteDeliverableMock).toHaveBeenCalledWith('/old/path.zip')
  })

  it('does not attempt cleanup when there was no previous deliverable', async () => {
    wireQueryMock({ previousRemotePath: null })
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ private: false }, 200))
      .mockResolvedValueOnce(jsonResponse({ commit: { sha: 'sha1' } }, 200))
      .mockResolvedValueOnce(zipResponse(200))
    vi.stubGlobal('fetch', fetchMock)
    uploadDeliverableMock.mockResolvedValueOnce({ remotePath: '/new/path.zip' })

    await snapshotGithubRepo('product-1', 'seller-1', 'octocat/hello', 'main')

    expect(deleteDeliverableMock).not.toHaveBeenCalled()
  })
})
