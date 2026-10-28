/**
 * Detects a GitHub repo's declared sponsorship/donation links — the same
 * thing GitHub itself resolves from `.github/FUNDING.yml` into the
 * "Sponsor this project" button on a repo's homepage.
 *
 * Primary method: the GraphQL API's `Repository.fundingLinks` field, which
 * returns already-resolved URLs (GitHub does the platform -> URL mapping
 * for us). Fallback: fetch `.github/FUNDING.yml` (or `.yaml`) via the REST
 * contents endpoint and parse it ourselves, since a repo's funding file can
 * exist slightly ahead of GitHub's own GraphQL indexing of it, or GraphQL
 * can be unreachable while REST still works.
 *
 * Every entry here is the developer's own external donation link, never a
 * platform's generic homepage: a bare platform name in FUNDING.yml is a
 * username/slug, and every URL builder below points at that person's own
 * page on the platform.
 */

export type FundingLink = { platform: string; url: string }

const GITHUB_HEADERS = (accessToken: string) => ({
  Authorization: `Bearer ${accessToken}`,
  Accept: 'application/vnd.github+json',
  'User-Agent': 'AIAppsBase-App',
})

/** Builds a platform's funding URL from the username/slug in FUNDING.yml. */
const PLATFORM_URL_BUILDERS: Record<string, (value: string) => string> = {
  github: (v) => `https://github.com/sponsors/${v}`,
  patreon: (v) => `https://patreon.com/${v}`,
  open_collective: (v) => `https://opencollective.com/${v}`,
  ko_fi: (v) => `https://ko-fi.com/${v}`,
  buy_me_a_coffee: (v) => `https://buymeacoffee.com/${v}`,
  liberapay: (v) => `https://liberapay.com/${v}`,
  tidelift: (v) => `https://tidelift.com/funding/github/${v}`,
  community_bridge: (v) => `https://crowdfunding.lfx.linuxfoundation.org/projects/${v}`,
  lfx_crowdfunding: (v) => `https://crowdfunding.lfx.linuxfoundation.org/projects/${v}`,
  issuehunt: (v) => `https://issuehunt.io/r/${v}`,
  otechie: (v) => `https://otechie.com/${v}`,
  polar: (v) => `https://polar.sh/${v}`,
  thanks_dev: (v) => `https://thanks.dev/${v}`,
}

function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim())
}

/**
 * Minimal line-based parser for the small, fixed FUNDING.yml schema (flat
 * top-level keys, each either a scalar, an inline `[a, b]` flow list, or a
 * block `- a` list) — not a general-purpose YAML parser, and not meant to
 * be one; GitHub's own FUNDING.yml shape never needs more than this.
 */
function parseFundingYaml(text: string): Record<string, string[]> {
  const result: Record<string, string[]> = {}
  let currentKey: string | null = null

  const unquote = (s: string) => s.trim().replace(/^['"]|['"]$/g, '')

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, '').trimEnd()
    if (!line.trim()) continue

    const blockItem = /^\s+-\s*(.+)$/.exec(line)
    if (blockItem && currentKey) {
      const value = unquote(blockItem[1])
      if (value) (result[currentKey] ||= []).push(value)
      continue
    }

    const kv = /^([a-zA-Z_]+):\s*(.*)$/.exec(line.trim())
    if (!kv) continue
    const [, key, rest] = kv
    const value = rest.trim()

    if (!value) {
      // Bare `key:` — either an empty/null value, or a block list follows.
      result[key] = result[key] || []
      currentKey = key
      continue
    }
    currentKey = null
    if (value.startsWith('[') && value.endsWith(']')) {
      result[key] = value.slice(1, -1).split(',').map(unquote).filter(Boolean)
    } else {
      const unquoted = unquote(value)
      if (unquoted) result[key] = [unquoted]
    }
  }
  return result
}

function buildFundingLinksFromYaml(parsed: Record<string, string[]>): FundingLink[] {
  const links: FundingLink[] = []
  for (const [key, values] of Object.entries(parsed)) {
    for (const value of values) {
      if (!value) continue
      if (key === 'custom') {
        if (isHttpUrl(value)) links.push({ platform: 'custom', url: value })
        continue
      }
      const build = PLATFORM_URL_BUILDERS[key]
      if (build) links.push({ platform: key, url: build(value) })
    }
  }
  return links
}

/** GraphQL path: returns already-resolved { platform, url } pairs, or null on failure. */
async function fetchViaGraphql(accessToken: string, owner: string, name: string): Promise<FundingLink[] | null> {
  try {
    const res = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: { ...GITHUB_HEADERS(accessToken), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `query($owner: String!, $name: String!) {
          repository(owner: $owner, name: $name) {
            fundingLinks { platform url }
          }
        }`,
        variables: { owner, name },
      }),
    })
    if (!res.ok) return null
    const body = await res.json()
    const links = body?.data?.repository?.fundingLinks
    if (!Array.isArray(links)) return null
    return links
      .filter((l: any) => l && typeof l.url === 'string' && isHttpUrl(l.url))
      .map((l: any) => ({ platform: String(l.platform || 'custom').toLowerCase(), url: l.url }))
  } catch (error) {
    console.error('[github-funding] graphql fetch failed', `${owner}/${name}`, error)
    return null
  }
}

async function fetchFundingFile(accessToken: string, repoFullName: string, filename: string): Promise<string | null> {
  try {
    const res = await fetch(`https://api.github.com/repos/${repoFullName}/contents/.github/${filename}`, {
      headers: GITHUB_HEADERS(accessToken),
    })
    if (!res.ok) return null
    const body = await res.json()
    if (typeof body?.content !== 'string' || body.encoding !== 'base64') return null
    return Buffer.from(body.content, 'base64').toString('utf-8')
  } catch (error) {
    console.error('[github-funding] contents fetch failed', repoFullName, filename, error)
    return null
  }
}

/** REST fallback: fetches + parses .github/FUNDING.yml (then .yaml), or null if neither exists/is reachable. */
async function fetchViaRest(accessToken: string, repoFullName: string): Promise<FundingLink[] | null> {
  const text = (await fetchFundingFile(accessToken, repoFullName, 'FUNDING.yml'))
    ?? (await fetchFundingFile(accessToken, repoFullName, 'FUNDING.yaml'))
  if (text === null) return null
  return buildFundingLinksFromYaml(parseFundingYaml(text))
}

/**
 * Detects a repo's declared funding links. Returns:
 * - an array (possibly empty) once the repo is confirmed to have no/some
 *   funding config
 * - null when neither method could even be checked (bad/missing token,
 *   repo unreachable, rate-limited) — callers should leave whatever is
 *   already stored alone in that case, same convention as fetchGithubRepoStats.
 */
export async function fetchGithubFundingLinks(
  accessToken: string | null,
  repoFullName: string
): Promise<FundingLink[] | null> {
  if (!accessToken) return null
  const [owner, name] = repoFullName.split('/')
  if (!owner || !name) return null

  const viaGraphql = await fetchViaGraphql(accessToken, owner, name)
  if (viaGraphql && viaGraphql.length > 0) return viaGraphql

  const viaRest = await fetchViaRest(accessToken, repoFullName)
  if (viaRest !== null) return viaRest

  // REST fallback couldn't be checked either; a confirmed-empty GraphQL
  // result still counts as a real (empty) answer.
  return viaGraphql
}
