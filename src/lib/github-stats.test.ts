import { describe, it, expect, beforeEach, vi } from 'vitest'
import { fetchGithubRepoStats } from './github-stats'

function jsonResponse(body: unknown, opts: { ok?: boolean; linkHeader?: string } = {}) {
  const headers = new Headers()
  if (opts.linkHeader) headers.set('link', opts.linkHeader)
  return {
    ok: opts.ok ?? true,
    headers,
    json: async () => body,
  } as unknown as Response
}

describe('fetchGithubRepoStats', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('maps repo fields and reads totals from the Link header pagination trick', async () => {
    const fetchMock = vi.fn()
      // repo metadata
      .mockResolvedValueOnce(
        jsonResponse({ stargazers_count: 42, forks_count: 7, subscribers_count: 5, open_issues_count: 3 })
      )
      // contributors (per_page=1) -> Link header says the last page is 12
      .mockResolvedValueOnce(
        jsonResponse([{ login: 'a' }], {
          linkHeader: '<https://api.github.com/repos/o/r/contributors?per_page=1&page=2>; rel="next", <https://api.github.com/repos/o/r/contributors?per_page=1&page=12>; rel="last"',
        })
      )
      // commits (per_page=1) -> Link header says the last page is 340
      .mockResolvedValueOnce(
        jsonResponse([{ sha: 'abc' }], {
          linkHeader: '<https://api.github.com/repos/o/r/commits?per_page=1&page=340>; rel="last"',
        })
      )
    vi.stubGlobal('fetch', fetchMock)

    const stats = await fetchGithubRepoStats('token', 'o/r', 'main')

    expect(stats).toEqual({ stars: 42, forks: 7, watchers: 5, issues: 3, commits: 340, contributors: 12 })
    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.github.com/repos/o/r')
  })

  it('falls back to the response array length when there is no Link header (single page)', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ stargazers_count: 1, forks_count: 0, open_issues_count: 0 }))
      .mockResolvedValueOnce(jsonResponse([{ login: 'solo' }]))
      .mockResolvedValueOnce(jsonResponse([{ sha: 'one' }, { sha: 'two' }]))
    vi.stubGlobal('fetch', fetchMock)

    const stats = await fetchGithubRepoStats('token', 'o/r')
    expect(stats?.contributors).toBe(1)
    expect(stats?.commits).toBe(2)
  })

  it('returns null when the repo itself cannot be reached', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(jsonResponse({}, { ok: false })))
    const stats = await fetchGithubRepoStats('token', 'o/private-repo')
    expect(stats).toBeNull()
  })

  it('returns null and never throws on a network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValueOnce(new Error('network down')))
    const stats = await fetchGithubRepoStats('token', 'o/r')
    expect(stats).toBeNull()
  })
})
