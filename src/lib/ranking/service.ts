/** Server-side entry points for ranked product discovery and search. */

import type { Repo } from '@/lib/marketplace-config'
import { matchesFilters, PRODUCTS_PER_PAGE, type Filters } from '@/lib/marketplace-filters'
import { getCatalogSnapshot } from './catalog'
import { rankDiscovery, rankSearch, type Explain } from './engine'

export type RankedProduct = { product: Repo; explain: Explain }

let discoveryCache: { builtAt: number; ranked: RankedProduct[] } | null = null

/**
 * The /products default order: the whole live catalog, ranked and diversified.
 * Computed once per catalog snapshot and reused until the snapshot refreshes.
 */
export async function getDiscoveryRanking(): Promise<RankedProduct[]> {
  try {
    const snap = await getCatalogSnapshot()
    if (discoveryCache?.builtAt !== snap.builtAt) {
      discoveryCache = {
        builtAt: snap.builtAt,
        ranked: rankDiscovery(snap.items).map((r) => ({ product: r.item.payload, explain: r.explain })),
      }
    }
    return discoveryCache.ranked
  } catch (err) {
    console.error('getDiscoveryRanking failed:', (err as Error).message)
    return []
  }
}

/** Ranked search over the live catalog. Ranking and diversity run on the full candidate set before `limit`. */
export async function searchRankedProducts(q: string, limit = 20): Promise<RankedProduct[]> {
  const snap = await getCatalogSnapshot()
  return rankSearch(snap.items, snap.index, q)
    .slice(0, limit)
    .map((r) => ({ product: r.item.payload, explain: r.explain }))
}

export type ProductsPageResult = {
  products: Repo[]
  total: number
  totalPages: number
  /** Clamped into [1, totalPages] — out-of-range requests fall back to the nearest valid page. */
  page: number
}

/**
 * The /products query: facet-filter, rank (search or discovery) and sort the
 * cached catalog snapshot, then slice out only the requested page.
 *
 * The snapshot itself is one query shared across all requests (60s TTL, see
 * `getCatalogSnapshot`) — ranking and seller-diversity need the whole
 * candidate pool to work at all, so that part can't be pushed into a
 * SQL LIMIT/OFFSET. What this function guarantees instead is the part that
 * actually reaches the browser: only `pageSize` products (and therefore only
 * their images) are ever returned to the caller, never the full catalog.
 */
export async function getProductsPage(opts: {
  filters: Filters
  sort: string
  page: number
  pageSize?: number
}): Promise<ProductsPageResult> {
  const pageSize = opts.pageSize ?? PRODUCTS_PER_PAGE
  let snap
  try {
    snap = await getCatalogSnapshot()
  } catch (err) {
    console.error('getProductsPage failed:', (err as Error).message)
    return { products: [], total: 0, totalPages: 1, page: 1 }
  }

  const candidates = snap.items.filter((item) => matchesFilters(item.payload, opts.filters))
  const query = opts.filters.q.trim()
  const ranked = query ? rankSearch(candidates, snap.index, query) : rankDiscovery(candidates)
  let out = ranked.map((r) => r.item.payload)

  if (opts.sort !== 'recommended') {
    out = [...out].sort((a, b) => {
      switch (opts.sort) {
        case 'newest': return b.createdAt.localeCompare(a.createdAt)
        case 'top-rated': return b.rating - a.rating || b.reviewCount - a.reviewCount
        case 'most-stars': return b.stars - a.stars
        case 'price-low': return a.price - b.price
        case 'price-high': return b.price - a.price
        // Trending = recent, normalised buyer activity rather than all-time sales.
        case 'trending': return (b.rank?.popularity ?? 0) - (a.rank?.popularity ?? 0)
        default: return 0
      }
    })
  }

  const total = out.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const page = Math.min(Math.max(1, Math.floor(opts.page) || 1), totalPages)
  const products = out.slice((page - 1) * pageSize, page * pageSize)

  return { products, total, totalPages, page }
}
