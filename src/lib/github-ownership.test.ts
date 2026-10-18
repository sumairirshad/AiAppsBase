import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Readable } from 'stream'
import {
  GithubApiError, fetchGithubCommitZipballStream, resolveCommitSha, verifyGithubRepoOwnership,
} from './github-ownership'

const originalFetch = global.fetch

afterEach(() => {
  global.fetch = originalFetch
})

function jsonResponse(status: number, body: unknown, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), { status, headers })
}

describe('verifyGithubRepoOwnership', () => {
  it('accepts a repo where the token has push access', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      jsonResponse(200, { default_branch: 'main', permissions: { push: true } })
    ) as any
    const res = await verifyGithubRepoOwnership('tok', 'seller/repo')
    expect(res).toEqual({ ok: true, defaultBranch: 'main' })
  })

  it('accepts a repo where the token only has admin (owner) access', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      jsonResponse(200, { default_branch: 'develop', permissions: { admin: true, push: false } })
    ) as any
    const res = await verifyGithubRepoOwnership('tok', 'seller/repo')
    expect(res).toEqual({ ok: true, defaultBranch: 'develop' })
  })

  it('rejects a repo the token can only read (no push/admin/maintain)', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      jsonResponse(200, { default_branch: 'main', permissions: { pull: true, push: false, admin: false } })
    ) as any
    const res = await verifyGithubRepoOwnership('tok', 'someone-else/repo')
    expect(res).toEqual({ ok: false, reason: 'no_write_access' })
  })

  it('rejects a repo that does not exist or is unreachable with this token', async () => {
    global.fetch = vi.fn().mockResolvedValue(new Response('', { status: 404 })) as any
    const res = await verifyGithubRepoOwnership('tok', 'ghost/repo')
    expect(res).toEqual({ ok: false, reason: 'not_found' })
  })

  it('throws GithubApiError (not a plain rejection) on rate limiting, distinct from "no access"', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response('', { status: 403, headers: { 'x-ratelimit-remaining': '0' } })
    ) as any
    await expect(verifyGithubRepoOwnership('tok', 'seller/repo')).rejects.toThrow(GithubApiError)
  })
})

describe('resolveCommitSha', () => {
  it('returns the resolved sha for a valid ref', async () => {
    const sha = 'a'.repeat(40)
    global.fetch = vi.fn().mockResolvedValue(new Response(sha, { status: 200 })) as any
    await expect(resolveCommitSha('tok', 'seller/repo', 'main')).resolves.toBe(sha)
  })

  it('throws for a ref that does not exist', async () => {
    global.fetch = vi.fn().mockResolvedValue(new Response('', { status: 404 })) as any
    await expect(resolveCommitSha('tok', 'seller/repo', 'no-such-branch')).rejects.toThrow(GithubApiError)
  })

  it('throws on a malformed sha response rather than silently accepting it', async () => {
    global.fetch = vi.fn().mockResolvedValue(new Response('not-a-sha', { status: 200 })) as any
    await expect(resolveCommitSha('tok', 'seller/repo', 'main')).rejects.toThrow(GithubApiError)
  })
})

describe('fetchGithubCommitZipballStream', () => {
  it('streams the zipball body through without buffering it first', async () => {
    const payload = Buffer.from('fake-zip-bytes')
    const webStream = Readable.toWeb(Readable.from([payload])) as any
    global.fetch = vi.fn().mockResolvedValue(new Response(webStream, { status: 200 })) as any

    const stream = await fetchGithubCommitZipballStream('tok', 'seller/repo', 'a'.repeat(40))
    const chunks: Buffer[] = []
    for await (const chunk of stream) chunks.push(chunk as Buffer)
    expect(Buffer.concat(chunks).toString()).toBe('fake-zip-bytes')
  })

  it('throws GithubApiError when GitHub rejects the request', async () => {
    global.fetch = vi.fn().mockResolvedValue(new Response('', { status: 500 })) as any
    await expect(fetchGithubCommitZipballStream('tok', 'seller/repo', 'a'.repeat(40))).rejects.toThrow(GithubApiError)
  })
})
