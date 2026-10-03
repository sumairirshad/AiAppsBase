import { describe, expect, it } from 'vitest'
import { escapeLike, matchesAllTerms, searchTerms } from './search'

describe('searchTerms', () => {
  it('splits on whitespace, lower-cases and de-duplicates', () => {
    expect(searchTerms('  Next.js   SaaS next.js ')).toEqual(['next.js', 'saas'])
  })
  it('returns no terms for blank input', () => {
    expect(searchTerms('   ')).toEqual([])
  })
  it('caps the number of terms', () => {
    expect(searchTerms('a b c d e f g h')).toHaveLength(6)
  })
})

describe('matchesAllTerms', () => {
  it('matches words in any order and position', () => {
    expect(matchesAllTerms('Dify — open-source LLM chatbot platform (AI Projects)', searchTerms('ai chatbot'))).toBe(true)
  })
  it('requires every word', () => {
    expect(matchesAllTerms('Admin dashboard in React', searchTerms('dashboard vue'))).toBe(false)
  })
})

describe('escapeLike', () => {
  it('escapes LIKE wildcards', () => {
    expect(escapeLike('100%_off\\')).toBe('100\\%\\_off\\\\')
  })
})
