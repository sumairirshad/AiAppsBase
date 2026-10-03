/**
 * Shared search-term handling for the header search API and the marketplace
 * page filter, so both match the same products for the same query.
 */

const MAX_QUERY_LENGTH = 100
const MAX_TERMS = 6

/** Lower-cased, de-duplicated words of a query ("Next.js  SaaS" → ["next.js", "saas"]). */
export function searchTerms(query: string): string[] {
  const words = query.slice(0, MAX_QUERY_LENGTH).toLowerCase().split(/\s+/).filter(Boolean)
  return Array.from(new Set(words)).slice(0, MAX_TERMS)
}

/** True when every term appears somewhere in the searchable text. */
export function matchesAllTerms(haystack: string, terms: string[]): boolean {
  const hay = haystack.toLowerCase()
  return terms.every((t) => hay.includes(t))
}

/** Escapes LIKE wildcards so user input is matched literally. */
export function escapeLike(term: string): string {
  return term.replace(/[\\%_]/g, (c) => `\\${c}`)
}
