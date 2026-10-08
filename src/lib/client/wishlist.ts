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

    if (res.ok) return { ok: true }
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
