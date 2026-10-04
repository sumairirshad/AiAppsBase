/** Server-side entry points for ranked product discovery and search. */

import type { Repo } from '@/lib/marketplace-config'
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
