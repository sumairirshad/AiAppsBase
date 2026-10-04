/**
 * Text relevance for product search: normalisation, light stemming,
 * synonym expansion, typo tolerance and field-weighted, saturating term
 * scoring (so keyword stuffing stops paying off after the first mention).
 *
 * Pure and dependency-free so it runs on the server (header search) and in
 * the browser (/products in-page search) with identical results.
 */

export type SearchDoc = {
  title: string
  /** Repository / slug name, e.g. "saas-starter". */
  name?: string
  description: string
  tags: string[]
  techStack: string[]
  category: string
  subcategory?: string
  language?: string
}

type Field = 'title' | 'name' | 'tags' | 'tech' | 'category' | 'description'

/** How much a match in each field is worth. Title matches matter most. */
const FIELD_WEIGHTS: Record<Field, number> = {
  title: 3,
  name: 2,
  tech: 1.8,
  tags: 1.6,
  category: 1.4,
  description: 1,
}
const MAX_FIELD_SCORE = FIELD_WEIGHTS.title * 1.3

const STOPWORDS = new Set([
  'a', 'an', 'and', 'or', 'the', 'for', 'with', 'of', 'to', 'in', 'on', 'by', 'at', 'from', 'is', 'it',
  'this', 'that', 'using', 'use', 'based', 'built', 'your', 'my', 'me', 'i', 'we', 'you', 'be', 'as',
])

/** Light suffix stripper. Applied identically to queries and documents, so conflations are consistent. */
export function stem(token: string): string {
  let t = token
  if (t.length <= 3 || /\d/.test(t)) return t
  if (t.endsWith('ies') && t.length > 4) return t.slice(0, -3) + 'y'
  if (t.endsWith('ing') && t.length > 5) t = t.slice(0, -3)
  else if (t.endsWith('ers') && t.length > 5) t = t.slice(0, -3)
  else if (t.endsWith('er') && t.length > 5) t = t.slice(0, -2)
  else if (t.endsWith('ed') && t.length > 5) t = t.slice(0, -2)
  else if (/(sh|ch|x|ss|z)es$/.test(t)) t = t.slice(0, -2)
  else if (t.endsWith('s') && !/(ss|us|is|as)$/.test(t)) t = t.slice(0, -1)
  if (t.endsWith('e') && t.length > 5) t = t.slice(0, -1)
  return t
}

/**
 * Lower-cases, strips accents and folds common spellings together
 * ("Next.js" → "nextjs", "e-commerce" → "ecommerce").
 */
export function normalizeText(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/(\w)\.(\w)/g, '$1$2') // next.js → nextjs, cal.com → calcom
    .replace(/\bc\+\+/g, 'cpp')
    .replace(/\bc#/g, 'csharp')
}

/**
 * Tokenises normalised text. Hyphenated words yield the joined form and,
 * for documents, the parts too ("real-time" → realtime, real, time).
 */
export function tokenize(text: string, { keepParts = true }: { keepParts?: boolean } = {}): string[] {
  const out: string[] = []
  for (const chunk of normalizeText(text).split(/[^a-z0-9-]+/)) {
    if (!chunk) continue
    const parts = chunk.split('-').filter(Boolean)
    if (parts.length > 1) {
      out.push(parts.join(''))
      if (keepParts) out.push(...parts)
    } else {
      out.push(parts[0] ?? chunk)
    }
  }
  return out.filter((t) => t.length > 1 && !STOPWORDS.has(t)).map(stem)
}

/** Words that mean the same thing to a buyer. Matches through a synonym count a bit less than direct matches. */
const SYNONYM_GROUPS: string[][] = [
  ['ai', 'llm', 'gpt', 'openai', 'chatgpt', 'genai', 'ml', 'agent', 'agents', 'rag'],
  ['chatbot', 'chat', 'bot', 'assistant', 'conversational', 'copilot', 'agent'],
  ['ecommerce', 'commerce', 'shop', 'store', 'storefront', 'shopping', 'cart', 'checkout'],
  ['nextjs', 'next'],
  ['react', 'reactjs'],
  ['vue', 'vuejs', 'nuxt'],
  ['nodejs', 'node'],
  ['dashboard', 'admin', 'analytics', 'backoffice'],
  ['scraper', 'scraping', 'scrape', 'crawler', 'crawl', 'spider'],
  ['template', 'starter', 'boilerplate', 'kit', 'theme', 'scaffold'],
  ['mobile', 'ios', 'android', 'flutter', 'reactnative', 'expo'],
  ['saas', 'subscription', 'multitenant'],
  ['extension', 'chrome', 'addon', 'plugin'],
  ['cli', 'terminal', 'command', 'shell'],
  ['auth', 'authentication', 'login', 'sso', 'oauth'],
  ['landing', 'homepage', 'marketing'],
  ['portfolio', 'resume', 'personal'],
  ['blog', 'cms', 'content'],
  ['ui', 'component', 'components', 'design', 'kit'],
  ['python', 'py'],
  ['typescript', 'ts'],
  ['javascript', 'js'],
]

const SYNONYMS: Map<string, Set<string>> = (() => {
  const map = new Map<string, Set<string>>()
  for (const group of SYNONYM_GROUPS) {
    const stems = Array.from(new Set(group.map(stem)))
    for (const s of stems) {
      const set = map.get(s) ?? new Set<string>()
      stems.forEach((o) => o !== s && set.add(o))
      map.set(s, set)
    }
  }
  return map
})()

/** Optimal string alignment distance, bailing out once it exceeds `max`. */
export function editDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1
  const prev2 = new Array(b.length + 1).fill(0)
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j)
  for (let i = 1; i <= a.length; i++) {
    const cur = [i]
    let rowMin = i
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      let v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost)
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, prev2[j - 2] + 1)
      cur.push(v)
      rowMin = Math.min(rowMin, v)
    }
    if (rowMin > max) return max + 1
    for (let j = 0; j <= b.length; j++) prev2[j] = prev[j]
    prev = cur
  }
  return prev[b.length]
}

type IndexedDoc = {
  fields: Record<Field, Map<string, number>>
  descLength: number
  titleSeq: string[]
  descSeq: string[]
}

export type SearchIndex = {
  docs: Map<string, IndexedDoc>
  /** Inverted index: token → ids of documents containing it (candidate generation). */
  postings: Map<string, string[]>
  /** Number of documents containing each token (any field). */
  df: Map<string, number>
  vocab: string[]
  size: number
  avgDescLength: number
}

function countTokens(tokens: string[]): Map<string, number> {
  const m = new Map<string, number>()
  for (const t of tokens) m.set(t, (m.get(t) ?? 0) + 1)
  return m
}

/** Builds the per-catalog index. Do this once per catalog snapshot, not per query. */
export function buildSearchIndex(items: { id: string; doc: SearchDoc }[]): SearchIndex {
  const docs = new Map<string, IndexedDoc>()
  const postings = new Map<string, string[]>()
  let descTotal = 0
  for (const { id, doc } of items) {
    if (docs.has(id)) continue
    const titleSeq = tokenize(doc.title)
    const descSeq = tokenize(doc.description.slice(0, 2000))
    const fields: Record<Field, Map<string, number>> = {
      title: countTokens(titleSeq),
      name: countTokens(tokenize(doc.name ?? '')),
      tags: countTokens(doc.tags.flatMap((t) => tokenize(t))),
      tech: countTokens([...doc.techStack, doc.language ?? ''].flatMap((t) => tokenize(t))),
      category: countTokens(tokenize(`${doc.category} ${doc.subcategory ?? ''}`)),
      description: countTokens(descSeq),
    }
    const seen = new Set<string>()
    for (const f of Object.values(fields)) f.forEach((_, t) => seen.add(t))
    seen.forEach((t) => {
      const list = postings.get(t)
      if (list) list.push(id)
      else postings.set(t, [id])
    })
    descTotal += descSeq.length
    docs.set(id, { fields, descLength: descSeq.length, titleSeq, descSeq })
  }
  const df = new Map(Array.from(postings, ([t, ids]) => [t, ids.length] as [string, number]))
  return {
    docs,
    postings,
    df,
    // Numbers ("v2", "2024") never need typo/prefix expansion.
    vocab: Array.from(df.keys()).filter((t) => !/^\d+$/.test(t)),
    size: docs.size,
    avgDescLength: docs.size ? Math.max(1, descTotal / docs.size) : 1,
  }
}

function idf(index: SearchIndex, token: string): number {
  const n = index.df.get(token) ?? 0
  return Math.log(1 + (index.size - n + 0.5) / (n + 0.5))
}

type Expansion = { token: string; weight: number }
type QueryTerm = { token: string; importance: number; expansions: Expansion[] }

export type ParsedQuery = { terms: QueryTerm[]; seq: string[] }

const MAX_QUERY_TERMS = 8

/** Turns a raw query into weighted terms, each with its synonym / typo / prefix expansions. */
export function parseQuery(index: SearchIndex, raw: string): ParsedQuery {
  const seq = Array.from(new Set(tokenize(raw.slice(0, 200), { keepParts: false }))).slice(0, MAX_QUERY_TERMS)
  const maxIdf = Math.log(1 + (index.size + 0.5) / 0.5)
  const terms = seq.map((token, i) => {
    const expansions = new Map<string, number>([[token, 1]])
    const add = (t: string, w: number) => expansions.set(t, Math.max(expansions.get(t) ?? 0, w))
    SYNONYMS.get(token)?.forEach((s) => add(s, 0.6))
    const inVocab = index.df.has(token)
    const isLast = i === seq.length - 1
    if (token.length >= 3) {
      const fuzzyMax = token.length >= 8 ? 2 : 1
      for (const v of index.vocab) {
        if (v === token) continue
        // Prefix matches help while typing ("dashb" → dashboard).
        if ((isLast || token.length >= 4) && v.startsWith(token) && v.length > token.length) {
          add(v, isLast ? 0.85 : 0.7)
        } else if (!inVocab && token.length >= 4 && Math.abs(v.length - token.length) <= fuzzyMax) {
          const d = editDistance(token, v, fuzzyMax)
          if (d <= fuzzyMax) add(v, d === 1 ? 0.75 : 0.55)
        }
      }
    }
    const list = Array.from(expansions, ([t, weight]) => ({ token: t, weight }))
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 16)
    // Rare words carry intent; very common words ("app", "template") matter less.
    const matched = list.filter((e) => index.df.has(e.token))
    const importance = inVocab
      ? idf(index, token)
      : matched.length
        ? Math.max(...matched.map((e) => idf(index, e.token)))
        : 0.6 * maxIdf // a word nothing in the catalog matches still counts, but can't erase every other match
    return { token, importance: Math.max(importance, 0.05), expansions: list }
  })
  return { terms, seq }
}

function fieldScore(index: SearchIndex, doc: IndexedDoc, token: string): number {
  let best = 0
  let total = 0
  for (const f of Object.keys(FIELD_WEIGHTS) as Field[]) {
    const tf = doc.fields[f].get(token) ?? 0
    if (!tf) continue
    // Short fields count a match once; the description saturates (BM25-style),
    // so repeating a keyword gives quickly diminishing returns.
    let sat = 1
    if (f === 'description') {
      const k = 1.2 * (0.25 + 0.75 * (doc.descLength / index.avgDescLength))
      sat = tf / (tf + k)
    }
    const s = FIELD_WEIGHTS[f] * sat
    best = Math.max(best, s)
    total += s
  }
  return Math.min(MAX_FIELD_SCORE, best + 0.25 * (total - best))
}

function containsSeq(haystack: string[], needle: string[]): boolean {
  if (needle.length < 2 || needle.length > haystack.length) return false
  outer: for (let i = 0; i <= haystack.length - needle.length; i++) {
    for (let j = 0; j < needle.length; j++) if (haystack[i + j] !== needle[j]) continue outer
    return true
  }
  return false
}

export type RelevanceBreakdown = { relevance: number; coverage: number; matchQuality: number; phrase: number }

/**
 * Query relevance in [0, 1]. Combines IDF-weighted coverage (how much of the
 * query's meaning a product matches) with match quality (title vs. description,
 * direct vs. synonym/typo) and phrase/exact-title bonuses.
 */
export function scoreRelevance(index: SearchIndex, query: ParsedQuery, id: string): RelevanceBreakdown {
  const doc = index.docs.get(id)
  const zero = { relevance: 0, coverage: 0, matchQuality: 0, phrase: 0 }
  if (!doc || query.terms.length === 0) return zero

  let impTotal = 0
  let impMatched = 0
  let qualitySum = 0
  for (const term of query.terms) {
    impTotal += term.importance
    let best = 0
    for (const e of term.expansions) {
      const s = (fieldScore(index, doc, e.token) / MAX_FIELD_SCORE) * e.weight
      if (s > best) best = s
    }
    if (best > 0) {
      impMatched += term.importance
      qualitySum += term.importance * best
    }
  }
  if (impMatched === 0) return zero

  const coverage = impMatched / impTotal
  const matchQuality = qualitySum / impMatched
  let phrase = 0
  if (query.seq.length >= 2) {
    if (containsSeq(doc.titleSeq, query.seq)) phrase += 0.12
    else if (containsSeq(doc.descSeq, query.seq)) phrase += 0.05
  }
  if (doc.titleSeq.join(' ') === query.seq.join(' ')) phrase += 0.15

  const relevance = Math.min(1, Math.pow(coverage, 1.5) * (0.4 + 0.6 * matchQuality) + phrase * coverage)
  return { relevance, coverage, matchQuality, phrase }
}

/** Ids of every document matching at least one query term or expansion — the only ones worth scoring. */
export function candidateIds(index: SearchIndex, query: ParsedQuery): Set<string> {
  const ids = new Set<string>()
  for (const term of query.terms) {
    for (const e of term.expansions) index.postings.get(e.token)?.forEach((id) => ids.add(id))
  }
  return ids
}
