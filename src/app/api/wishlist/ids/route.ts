import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getSessionUserId } from '@/lib/session'

/**
 * Just the set of product ids the signed-in buyer has wishlisted — used to
 * initialize the heart/bookmark icon's real saved state on product cards
 * and the product detail page, without pulling the full wishlist (with
 * joined product/seller data) just to answer "is this one saved?".
 */
export async function GET() {
  const userId = await getSessionUserId()
  if (!userId) {
    return NextResponse.json({ productIds: [] })
  }

  try {
    const res = await query<{ product_id: string }>('SELECT product_id FROM wishlists WHERE user_id = $1', [userId])
    return NextResponse.json({ productIds: res.rows.map((r) => r.product_id) })
  } catch (error) {
    console.error('Wishlist ids fetch error:', error)
    return NextResponse.json({ productIds: [] })
  }
}
