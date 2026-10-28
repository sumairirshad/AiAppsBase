import { describe, it, expect, beforeEach, vi } from 'vitest'
import { fetchGithubFundingLinks } from './github-funding'

function jsonResponse(body: unknown, opts: { ok?: boolean } = {}) {
  return { ok: opts.ok ?? true, json: async () => body } as unknown as Response
}

function base64ContentsResponse(yaml: string) {
  return jsonResponse({ content: Buffer.from(yaml, 'utf-8').toString('base64'), encoding: 'base64' })
}

describe('fetchGithubFundingLinks', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('returns null without a token', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    expect(await fetchGithubFundingLinks(null, 'o/r')).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('prefers the GraphQL result when it has links', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      jsonResponse({
        data: {
          repository: {
            fundingLinks: [
              { platform: 'GITHUB', url: 'https://github.com/sponsors/octocat' },
              { platform: 'PATREON', url: 'https://patreon.com/octocat' },
            ],
          },
        },
      })
    )
    vi.stubGlobal('fetch', fetchMock)

    const links = await fetchGithubFundingLinks('token', 'o/r')

    expect(links).toEqual([
      { platform: 'github', url: 'https://github.com/sponsors/octocat' },
      { platform: 'patreon', url: 'https://patreon.com/octocat' },
    ])
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.github.com/graphql')
  })

  it('falls back to parsing FUNDING.yml when GraphQL reports no links', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ data: { repository: { fundingLinks: [] } } })) // graphql: empty
      .mockResolvedValueOnce(base64ContentsResponse(
        [
          'github: octocat',
          'patreon: octocat_patreon',
          'open_collective: myproject',
          'ko_fi: # inline comment should be stripped',
          'custom: ["https://www.paypal.me/octocat"]',
        ].join('\n')
      ))
    vi.stubGlobal('fetch', fetchMock)

    const links = await fetchGithubFundingLinks('token', 'octocat/hello-world')

    expect(links).toEqual(
      expect.arrayContaining([
        { platform: 'github', url: 'https://github.com/sponsors/octocat' },
        { platform: 'patreon', url: 'https://patreon.com/octocat_patreon' },
        { platform: 'open_collective', url: 'https://opencollective.com/myproject' },
        { platform: 'custom', url: 'https://www.paypal.me/octocat' },
      ])
    )
    expect(fetchMock.mock.calls[1][0]).toBe(
      'https://api.github.com/repos/octocat/hello-world/contents/.github/FUNDING.yml'
    )
  })

  it('parses a block-style list for a platform that supports multiple usernames', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ data: { repository: { fundingLinks: [] } } }))
      .mockResolvedValueOnce(base64ContentsResponse(['github:', '  - octocat', '  - monalisa'].join('\n')))
    vi.stubGlobal('fetch', fetchMock)

    const links = await fetchGithubFundingLinks('token', 'o/r')

    expect(links).toEqual([
      { platform: 'github', url: 'https://github.com/sponsors/octocat' },
      { platform: 'github', url: 'https://github.com/sponsors/monalisa' },
    ])
  })

  it('tries FUNDING.yaml when FUNDING.yml is missing', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ data: { repository: { fundingLinks: [] } } }))
      .mockResolvedValueOnce(jsonResponse({}, { ok: false })) // FUNDING.yml 404
      .mockResolvedValueOnce(base64ContentsResponse('ko_fi: octocat'))
    vi.stubGlobal('fetch', fetchMock)

    const links = await fetchGithubFundingLinks('token', 'o/r')

    expect(links).toEqual([{ platform: 'ko_fi', url: 'https://ko-fi.com/octocat' }])
    expect(fetchMock.mock.calls[2][0]).toBe('https://api.github.com/repos/o/r/contents/.github/FUNDING.yaml')
  })

  it('returns [] once both GraphQL and the file fetch confirm there is no funding config', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ data: { repository: { fundingLinks: [] } } }))
      .mockResolvedValueOnce(jsonResponse({}, { ok: false })) // FUNDING.yml 404
      .mockResolvedValueOnce(jsonResponse({}, { ok: false })) // FUNDING.yaml 404
    vi.stubGlobal('fetch', fetchMock)

    expect(await fetchGithubFundingLinks('token', 'o/r')).toEqual([])
  })

  it('returns null (undetermined) when GraphQL errors and the file fetch also cannot be checked', async () => {
    const fetchMock = vi.fn()
      .mockRejectedValueOnce(new Error('network down'))
      .mockRejectedValueOnce(new Error('network down'))
      .mockRejectedValueOnce(new Error('network down'))
    vi.stubGlobal('fetch', fetchMock)

    expect(await fetchGithubFundingLinks('token', 'o/r')).toBeNull()
  })

  it('ignores a non-URL custom entry and a platform key with no builder', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ data: { repository: { fundingLinks: [] } } }))
      .mockResolvedValueOnce(base64ContentsResponse(['custom: not-a-url', 'made_up_platform: someone'].join('\n')))
    vi.stubGlobal('fetch', fetchMock)

    expect(await fetchGithubFundingLinks('token', 'o/r')).toEqual([])
  })
})
