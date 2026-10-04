/**
 * Ranking engine shared by header search, the /products listing and any
 * future recommendation surface. Each context uses the same scorers with
 * its own weights:
 *
 *   candidates → component scores → (relevance) → weighted score
 *     → exact de-dupe → near-duplicate demotion → seller diversity
 *     → final ordered list → pagination by the caller
 */

import { dedupeById, diversify, findNearDuplicates, type DiversityOptions } from './diversity'
import { candidateIds, parseQuery, scoreRelevance, tokenize, type SearchDoc, type SearchIndex } from './text'
import type { Components } from './signals'

export type RankItem<T = unknown> = {
  id: string
  sellerId: string
  doc: SearchDoc
  components: Components
  /** Identifies the underlying source (e.g. GitHub repo) for duplicate detection. */
  dupKey?: string
  /** Tokenised title; filled in on first use and reused while the item lives (e.g. a cached snapshot). */
  titleTokens?: string[]
  payload: T
}

export type Explain = {
  relevance?: number
  coverage?: number
  quality: number
  popularity: number
  seller: number
  freshness: number
  exploration: number
  /** Score before duplicate and diversity adjustments. */
  base: number
  duplicatePenalty: number
  /** Fraction of the score removed by seller diversification at this position. */
  diversityPenalty: number
  final: number
}

export type Ranked<T = unknown> = { item: RankItem<T>; score: number; explain: Explain }

type Weights = { quality: number; popularity: number; seller: number; freshness: number; exploration: number }

export type RankingConfig = {
  /** Weights of the non-query components (sum to 1). */
  weights: Weights
  diversity: DiversityOptions
  /** Multiplier for a near-duplicate of a better-ranked listing. */
  duplicateFactor: number
}

/**
 * /products default listing: no query, so quality, popularity and seller
 * reputation lead. Freshness and exploration are bounded boosts — together
 * they can lift a strong new listing past mediocre old ones, but not past
 * established, well-reviewed, selling products.
 */
export const DISCOVERY_CONFIG: RankingConfig = {
  weights: { quality: 0.4, popularity: 0.22, seller: 0.18, freshness: 0.06, exploration: 0.14 },
  diversity: { decay: 0.78, window: 10 },
  duplicateFactor: 0.55,
}

/**
 * Search: relevance dominates (RELEVANCE_WEIGHT); the remaining share is a
 * quality/popularity/seller blend that only counts in full once a product is
 * reasonably relevant, so popular-but-off-topic products can't ride their
 * popularity into the results.
 */
export const SEARCH_CONFIG: RankingConfig & { relevanceWeight: number; relevanceGate: number; minRelevance: number; relativeCutoff: number } = {
  relevanceWeight: 0.62,
  relevanceGate: 0.45,
  minRelevance: 0.1,
  relativeCutoff: 0.12,
  weights: { quality: 0.36, popularity: 0.22, seller: 0.18, freshness: 0.08, exploration: 0.16 },
  diversity: { decay: 0.75, window: 8 },
  duplicateFactor: 0.55,
}

function blend(c: Components, w: Weights): number {
  return w.quality * c.quality + w.popularity * c.popularity + w.seller * c.seller + w.freshness * c.freshness + w.exploration * c.exploration
}

const round = (x: number) => Math.round(x * 1000) / 1000

function finish<T>(
  scored: { item: RankItem<T>; base: number; relevance?: number; coverage?: number }[],
  config: RankingConfig
): Ranked<T>[] {
  const flat = dedupeById(
    scored.map((s) => ({
      id: s.item.id, sellerId: s.item.sellerId, score: s.base, title: s.item.doc.title, dupKey: s.item.dupKey,
      titleTokens: (s.item.titleTokens ??= tokenize(s.item.doc.title)), s,
    }))
  )
  const demote = findNearDuplicates(flat)
  const adjusted = flat.map((f) => ({ ...f, score: demote.has(f.id) ? f.score * config.duplicateFactor : f.score }))

  return diversify(adjusted, config.diversity).map(({ item: f, adjusted: final }) => {
    const c = f.s.item.components
    return {
      item: f.s.item,
      score: final,
      explain: {
        ...(f.s.relevance !== undefined ? { relevance: round(f.s.relevance), coverage: round(f.s.coverage ?? 0) } : {}),
        quality: round(c.quality),
        popularity: round(c.popularity),
        seller: round(c.seller),
        freshness: round(c.freshness),
        exploration: round(c.exploration),
        base: round(f.s.base),
        duplicatePenalty: demote.has(f.id) ? round(1 - config.duplicateFactor) : 0,
        diversityPenalty: f.score > 0 ? round(1 - final / f.score) : 0,
        final: round(final),
      },
    }
  })
}

/** Ranks a listing with no query (the /products default order). */
export function rankDiscovery<T>(items: RankItem<T>[], config: RankingConfig = DISCOVERY_CONFIG): Ranked<T>[] {
  return finish(items.map((item) => ({ item, base: blend(item.components, config.weights) })), config)
}

/**
 * Ranks items for a text query against a prebuilt index (built from the full
 * catalog so word rarity is catalog-wide). Items below the relevance cut-off
 * are excluded rather than padded in.
 */
export function rankSearch<T>(
  items: RankItem<T>[],
  index: SearchIndex,
  rawQuery: string,
  config = SEARCH_CONFIG
): Ranked<T>[] {
  const query = parseQuery(index, rawQuery)
  if (!query.terms.length) return rankDiscovery(items)

  // Candidate generation via the inverted index: only products sharing a term
  // (or synonym/typo/prefix expansion) with the query are scored at all.
  const candidates = candidateIds(index, query)
  const withRel = items
    .filter((item) => candidates.has(item.id))
    .map((item) => ({ item, rel: scoreRelevance(index, query, item.id) }))
  const top = Math.max(0, ...withRel.map((r) => r.rel.relevance))
  const cutoff = Math.max(config.minRelevance, config.relativeCutoff * top)

  const scored = withRel
    .filter((r) => r.rel.relevance >= cutoff)
    .map(({ item, rel }) => {
      const gate = Math.min(1, rel.relevance / config.relevanceGate)
      const base = config.relevanceWeight * rel.relevance + (1 - config.relevanceWeight) * blend(item.components, config.weights) * gate
      return { item, base, relevance: rel.relevance, coverage: rel.coverage }
    })
  return finish(scored, config)
}
