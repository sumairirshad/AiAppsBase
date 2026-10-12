import * as React from 'react'

type WishlistResult =
  | { ok: true }
  | { ok: false; reason: 'unauthorized' | 'error'; message: string }

async function callWishlist(method: 'POST' | 'DELETE', productId: string): Promise<WishlistResult> {
  try {
    const res = await fetch('/api/wishlist', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId }),
    })
    const data = await res.json().catch(() => ({}))

    if (res.ok) {
      mutateCachedWishlistIds(productId, method === 'POST')
      return { ok: true }
    }
    if (res.status === 401) {
      return { ok: false, reason: 'unauthorized', message: data.error || 'Please log in to continue' }
    }
    return { ok: false, reason: 'error', message: data.error || 'Something went wrong' }
  } catch {
    return { ok: false, reason: 'error', message: 'Something went wrong' }
  }
}

export const addToWishlist = (productId: string) => callWishlist('POST', productId)
export const removeFromWishlist = (productId: string) => callWishlist('DELETE', productId)

/**
 * Shared, page-session-scoped cache of the signed-in buyer's wishlisted
 * product ids, so every product card and the product detail page can show
 * the heart/bookmark icon's real saved state on load without each one
 * firing its own request.
 */
let cachedWishlistIds: Promise<Set<string>> | null = null

function fetchWishlistIds(): Promise<Set<string>> {
  if (!cachedWishlistIds) {
    cachedWishlistIds = fetch('/api/wishlist/ids')
      .then((res) => (res.ok ? res.json() : { productIds: [] }))
      .then((data) => new Set<string>(Array.isArray(data.productIds) ? data.productIds : []))
      .catch(() => new Set<string>())
  }
  return cachedWishlistIds
}

async function mutateCachedWishlistIds(productId: string, added: boolean) {
  if (!cachedWishlistIds) return
  const ids = await cachedWishlistIds
  if (added) ids.add(productId)
  else ids.delete(productId)
}

/** Call after sign-in/out so the next read reflects the new account's wishlist. */
export function resetWishlistIdsCache() {
  cachedWishlistIds = null
}

/** The current buyer's wishlisted product ids, or null while the first fetch is in flight. */
export function useWishlistIds(): Set<string> | null {
  const [ids, setIds] = React.useState<Set<string> | null>(null)

  React.useEffect(() => {
    let active = true
    fetchWishlistIds().then((result) => {
      if (active) setIds(result)
    })
    return () => {
      active = false
    }
  }, [])

  return ids
}
