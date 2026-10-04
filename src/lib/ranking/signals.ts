/**
 * Turns raw marketplace signals into normalised [0, 1] component scores.
 *
 * Every signal is bounded before it's combined: counts use log scaling
 * against a catalog reference (diminishing returns), ratings use a Bayesian
 * average (a few 5-star reviews can't beat a long track record), and
 * rates are smoothed toward a prior. Pure: no I/O, deterministic for a seed.
 */

export type SellerSignals = {
  id: string
  /** Weighted rating sum across the seller's live products (verified reviews weigh more). */
  ratingSum: number
  ratingWeight: number
  sales: number
  refunds: number
  verified: boolean
  createdAt: string | Date | null
}

export type ProductSignals = {
  id: string
  sellerId: string
  createdAt: string | Date | null
  updatedAt: string | Date | null
  /** Σ rating × weight, where verified-purchase reviews weigh 1 and others 0.5. */
  ratingSum: number
  ratingWeight: number
  reviewCount: number
  /** Completed orders (one per buyer per product, enforced by the DB). */
  sales: number
  recentSales: number
  /** Refunded + disputed orders. */
  refunds: number
  wishlists: number
  recentWishlists: number
  githubStars: number
  descriptionLength: number
  screenshotCount: number
  hasPreview: boolean
  featureCount: number
  techCount: number
  tagCount: number
  hasSource: boolean
}

export type Components = {
  quality: number
  popularity: number
  seller: number
  freshness: number
  exploration: number
  /** How much real buyer evidence exists (0 = none). Exploration fades as this grows. */
  evidence: number
}

const DAY = 86_400_000
const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : Number.isFinite(x) ? x : 0)

/** log1p(x) relative to a reference count, capped at 1 — 100→200 matters more than 10,000→10,100. */
export function logNorm(x: number, ref: number): number {
  if (!(x > 0)) return 0
  return clamp01(Math.log1p(x) / Math.log1p(Math.max(ref, 1)))
}

/** Bayesian average rating on a 1–5 scale, mapped to [0, 1]. Few reviews stay near the prior. */
export function bayesRating(sum: number, weight: number, prior = 3.5, priorWeight = 5): number {
  const avg = (prior * priorWeight + sum) / (priorWeight + Math.max(0, weight))
  return clamp01((avg - 1) / 4)
}

/** Refund/dispute rate smoothed toward a 5% prior so one refund on one sale isn't 100%. */
export function smoothedRefundRate(refunds: number, sales: number): number {
  const prior = 0.05
  const m = 10
  return (Math.max(0, refunds) + prior * m) / (Math.max(0, sales) + Math.max(0, refunds) + m)
}

/** Exponential decay with the given half-life in days. */
export function decay(ageDays: number, halfLifeDays: number): number {
  return Math.pow(0.5, Math.max(0, ageDays) / halfLifeDays)
}

/** Stable pseudo-random number in [0, 1) for a string (FNV-1a). Same input → same output. */
export function hash01(input: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0) / 4294967296
}

/** Daily-rotating seed: rankings stay stable within a day and rotate exploration slots across days. */
export function dailySeed(now = new Date()): string {
  return now.toISOString().slice(0, 10)
}

function ageDays(date: string | Date | null, now: number): number {
  if (!date) return 365
  const t = new Date(date).getTime()
  return Number.isFinite(t) ? Math.max(0, (now - t) / DAY) : 365
}

/** How complete and buyer-ready a listing is (screenshots, demo, description, features…). */
export function completeness(p: ProductSignals): number {
  return clamp01(
    0.25 * clamp01(p.descriptionLength / 400) +
    0.2 * clamp01(p.screenshotCount / 3) +
    0.15 * (p.hasPreview ? 1 : 0) +
    0.15 * clamp01(p.featureCount / 4) +
    0.1 * clamp01(p.techCount / 3) +
    0.05 * clamp01(p.tagCount / 3) +
    0.1 * (p.hasSource ? 1 : 0)
  )
}

/** The 90th percentile of a list, used as a catalog-relative reference for log scaling. */
function p90(values: number[]): number {
  if (!values.length) return 0
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.9))]
}

/**
 * Per-catalog references with floors, so a tiny catalog where the top product
 * has 2 sales doesn't treat 2 sales as "maximum popularity".
 */
export type CatalogRefs = { sales: number; recentSales: number; wishlists: number; stars: number; sellerSales: number }

export function catalogRefs(products: ProductSignals[], sellers: SellerSignals[]): CatalogRefs {
  return {
    sales: Math.max(50, p90(products.map((p) => p.sales))),
    recentSales: Math.max(10, p90(products.map((p) => p.recentSales))),
    wishlists: Math.max(25, p90(products.map((p) => p.wishlists + 2 * p.recentWishlists))),
    stars: Math.max(2000, p90(products.map((p) => p.githubStars))),
    sellerSales: Math.max(200, p90(sellers.map((s) => s.sales))),
  }
}

export function sellerScore(s: SellerSignals | undefined, refs: CatalogRefs, now: number): number {
  if (!s) return 0.35
  const refund = smoothedRefundRate(s.refunds, s.sales)
  return clamp01(
    0.4 * bayesRating(s.ratingSum, s.ratingWeight, 3.5, 10) +
    0.25 * logNorm(s.sales, refs.sellerSales) +
    0.15 * clamp01(1 - refund * 4) +
    0.1 * (s.verified ? 1 : 0) +
    0.1 * clamp01(ageDays(s.createdAt, now) / 365)
  )
}

/**
 * Computes all non-query components for every product. `seed` drives the
 * exploration rotation; pass `dailySeed()` in production.
 */
export function computeComponents(
  products: ProductSignals[],
  sellers: SellerSignals[],
  { seed, now = Date.now() }: { seed: string; now?: number }
): Map<string, Components> {
  const refs = catalogRefs(products, sellers)
  const sellerById = new Map(sellers.map((s) => [s.id, s]))
  const sellerScores = new Map<string, number>()
  const out = new Map<string, Components>()

  for (const p of products) {
    const age = ageDays(p.createdAt, now)
    const sinceUpdate = ageDays(p.updatedAt ?? p.createdAt, now)
    const complete = completeness(p)
    const refund = smoothedRefundRate(p.refunds, p.sales)

    const quality = clamp01(
      0.45 * bayesRating(p.ratingSum, p.ratingWeight) +
      0.25 * complete +
      0.15 * clamp01(1 - refund * 4) +
      0.15 * decay(sinceUpdate, 180)
    )

    const popularity = clamp01(
      0.4 * logNorm(p.recentSales, refs.recentSales) +
      0.25 * logNorm(p.sales, refs.sales) +
      0.2 * logNorm(p.wishlists + 2 * p.recentWishlists, refs.wishlists) +
      0.15 * logNorm(p.githubStars, refs.stars)
    )

    if (!sellerScores.has(p.sellerId)) sellerScores.set(p.sellerId, sellerScore(sellerById.get(p.sellerId), refs, now))
    const seller = sellerScores.get(p.sellerId)!

    const freshness = decay(age, 21)

    // Exploration: a temporary, controlled boost for listings without much buyer
    // evidence yet. It needs a reasonably complete listing (no boost for empty
    // listings), fades as real sales/reviews/saves arrive, and rotates daily via
    // a seeded hash so different new products get the slot on different days.
    const evidence = clamp01(1 - Math.exp(-(p.sales + 1.5 * p.reviewCount + 0.3 * p.wishlists) / 5))
    const completenessGate = clamp01((complete - 0.35) / 0.45)
    const recency = Math.max(decay(age, 30), 0.25)
    const rotation = 0.6 + 0.4 * hash01(`${seed}:${p.id}`)
    const exploration = clamp01((1 - evidence) * completenessGate * recency * rotation)

    out.set(p.id, { quality, popularity, seller, freshness, exploration, evidence })
  }
  return out
}
