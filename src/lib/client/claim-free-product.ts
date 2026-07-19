type ClaimFreeProductResult =
  | { ok: true; orderId: string }
  | { ok: false; reason: 'already-owned' | 'unauthorized' | 'error'; message: string }

export async function claimFreeProduct(
  productId: string,
  licenseType: string
): Promise<ClaimFreeProductResult> {
  try {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, licenseType }),
    })
    const data = await res.json().catch(() => ({}))

    if (res.ok) {
      return { ok: true, orderId: data.orderId }
    }
    if (res.status === 409) {
      return { ok: false, reason: 'already-owned', message: data.error || 'You already own this product' }
    }
    if (res.status === 401) {
      return { ok: false, reason: 'unauthorized', message: data.error || 'Please sign in to continue' }
    }
    return { ok: false, reason: 'error', message: data.error || 'Something went wrong' }
  } catch {
    return { ok: false, reason: 'error', message: 'Something went wrong' }
  }
}
