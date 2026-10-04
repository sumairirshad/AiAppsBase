/**
 * Server-side catalog snapshot for ranking: every live product with the
 * aggregates the scorers need, loaded in ONE query and cached briefly in
 * memory, with the search index built once per snapshot. Requests rank
 * against the snapshot instead of scanning orders/reviews each time.
 *
 * Scaling path: when the catalog outgrows memory (tens of thousands of
 * listings), move the aggregates into a precomputed table refreshed on a
 * schedule and generate search candidates with Postgres full-text search
 * before ranking. The engine itself doesn't change.
 */

import { query } from '@/lib/db'
import { mapRow } from '@/lib/products'
import type { Repo } from '@/lib/marketplace-config'
import { computeComponents, dailySeed, type ProductSignals, type SellerSignals } from './signals'
import { buildSearchIndex, type SearchIndex } from './text'
import type { RankItem } from './engine'

const SNAPSHOT_SQL = `
  WITH rev AS (
    SELECT product_id,
           SUM(rating * CASE WHEN verified THEN 1 ELSE 0.5 END)::float AS rating_sum,
           SUM(CASE WHEN verified THEN 1 ELSE 0.5 END)::float AS rating_weight,
           AVG(rating)::float AS avg_rating,
           COUNT(*)::int AS review_count
    FROM reviews GROUP BY product_id
  ),
  ord AS (
    SELECT product_id,
           COUNT(*) FILTER (WHERE status = 'completed')::int AS sales,
           COUNT(*) FILTER (WHERE status = 'completed' AND created_at > NOW() - INTERVAL '30 days')::int AS recent_sales,
           COUNT(*) FILTER (WHERE status IN ('refunded', 'disputed'))::int AS refunds
    FROM orders GROUP BY product_id
  ),
  wl AS (
    SELECT product_id,
           COUNT(*)::int AS wishlists,
           COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days')::int AS recent_wishlists
    FROM wishlists GROUP BY product_id
  )
  SELECT p.*,
         u.full_name AS seller_name, u.github_username AS seller_handle,
         u.is_verified AS seller_verified, u.created_at AS seller_created_at,
         rev.avg_rating AS rating, COALESCE(rev.review_count, 0) AS review_count,
         COALESCE(rev.rating_sum, 0) AS rating_sum, COALESCE(rev.rating_weight, 0) AS rating_weight,
         COALESCE(ord.sales, 0) AS sales, COALESCE(ord.recent_sales, 0) AS recent_sales,
         COALESCE(ord.refunds, 0) AS refunds,
         COALESCE(wl.wishlists, 0) AS wishlists, COALESCE(wl.recent_wishlists, 0) AS recent_wishlists
  FROM products p
  JOIN users u ON u.id = p.seller_id
  LEFT JOIN rev ON rev.product_id = p.id
  LEFT JOIN ord ON ord.product_id = p.id
  LEFT JOIN wl  ON wl.product_id  = p.id
  WHERE p.status = 'approved'
`

export type CatalogEntry = RankItem<Repo>

export type CatalogSnapshot = {
  items: CatalogEntry[]
  index: SearchIndex
  seed: string
  builtAt: number
}

function toSignals(row: any): ProductSignals {
  return {
    id: row.id,
    sellerId: row.seller_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ratingSum: Number(row.rating_sum) || 0,
    ratingWeight: Number(row.rating_weight) || 0,
    reviewCount: Number(row.review_count) || 0,
    sales: Number(row.sales) || 0,
    recentSales: Number(row.recent_sales) || 0,
    refunds: Number(row.refunds) || 0,
    wishlists: Number(row.wishlists) || 0,
    recentWishlists: Number(row.recent_wishlists) || 0,
    githubStars: Number(row.stars) || 0,
    descriptionLength: String(row.description || '').length,
    screenshotCount: (row.screenshots || []).filter(Boolean).length,
    hasPreview: Boolean(row.preview_url),
    featureCount: (row.features || []).length,
    techCount: (row.tech_stack || []).length,
    tagCount: (row.tags || []).length,
    hasSource: Boolean(row.github_repo_name || row.deliverable_remote_path),
  }
}

/** Seller aggregates over their live listings, derived from the same rows (no extra query). */
function sellerSignals(rows: any[]): SellerSignals[] {
  const map = new Map<string, SellerSignals>()
  for (const r of rows) {
    const s = map.get(r.seller_id) ?? {
      id: r.seller_id, ratingSum: 0, ratingWeight: 0, sales: 0, refunds: 0,
      verified: Boolean(r.seller_verified), createdAt: r.seller_created_at,
    }
    s.ratingSum += Number(r.rating_sum) || 0
    s.ratingWeight += Number(r.rating_weight) || 0
    s.sales += Number(r.sales) || 0
    s.refunds += Number(r.refunds) || 0
    map.set(r.seller_id, s)
  }
  return Array.from(map.values())
}

export async function loadCatalogSnapshot(now = new Date()): Promise<CatalogSnapshot> {
  const res = await query(SNAPSHOT_SQL)
  const rows = res.rows as any[]
  const seed = dailySeed(now)
  const components = computeComponents(rows.map(toSignals), sellerSignals(rows), { seed, now: now.getTime() })

  const items: CatalogEntry[] = rows.map((row) => {
    const repo = mapRow(row)
    const rank = components.get(row.id)!
    repo.rank = rank
    return {
      id: repo.id,
      sellerId: repo.sellerId,
      doc: {
        title: repo.title,
        name: repo.name,
        description: repo.description,
        tags: repo.tags,
        techStack: repo.techStack,
        category: repo.category,
        subcategory: repo.subcategory,
        language: repo.language,
      },
      components: rank,
      dupKey: row.github_repo_name || undefined,
      payload: repo,
    }
  })
  return { items, index: buildSearchIndex(items), seed, builtAt: now.getTime() }
}

const TTL_MS = 60_000
let cached: CatalogSnapshot | null = null
let inflight: Promise<CatalogSnapshot> | null = null

/** Cached snapshot (60s TTL, rebuilt when the day's exploration seed changes). Concurrent callers share one load. */
export async function getCatalogSnapshot(): Promise<CatalogSnapshot> {
  const now = Date.now()
  if (cached && now - cached.builtAt < TTL_MS && cached.seed === dailySeed()) return cached
  if (!inflight) {
    inflight = loadCatalogSnapshot()
      .then((snap) => (cached = snap))
      .finally(() => { inflight = null })
  }
  return inflight
}
