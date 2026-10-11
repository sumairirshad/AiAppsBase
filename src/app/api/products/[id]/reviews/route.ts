import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getSessionUserId } from '@/lib/session'
import { canBuyerReview } from '@/lib/products'

/**
 * Whether the signed-in buyer can review this product right now (has a
 * completed order, hasn't already reviewed it). Fetched client-side rather
 * than computed in the product page server component, so the product page
 * itself can stay statically cached (it reads cookies otherwise, which
 * would force it to render dynamically on every request for every visitor).
 */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getSessionUserId()
  const canReview = await canBuyerReview(userId, params.id)
  return NextResponse.json({ canReview })
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getSessionUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const rating = Number(body?.rating)
  const comment = typeof body?.comment === 'string' ? body.comment.trim() : ''

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 })
  }
  if (!comment) {
    return NextResponse.json({ error: 'Please write a short review' }, { status: 400 })
  }
  if (comment.length > 2000) {
    return NextResponse.json({ error: 'Review is too long (2000 characters max)' }, { status: 400 })
  }

  // A review is only allowed from a verified buyer: someone with a
  // completed order for this exact product. Fetch their display name in
  // the same query so the new review can be rendered immediately without a
  // second round trip.
  const orderRes = await query<{ full_name: string }>(
    `SELECT u.full_name FROM orders o JOIN users u ON u.id = o.buyer_id
     WHERE o.buyer_id = $1 AND o.product_id = $2 AND o.status = 'completed' LIMIT 1`,
    [userId, params.id]
  )
  if ((orderRes.rowCount ?? 0) === 0) {
    return NextResponse.json({ error: 'You can only review products you’ve purchased' }, { status: 403 })
  }

  try {
    // code_quality/design/documentation/value_for_money have no separate UI
    // yet — the single rating a buyer gives is stored for all of them.
    const res = await query<{ id: string; created_at: string }>(
      `INSERT INTO reviews (product_id, user_id, rating, code_quality, design, documentation, value_for_money, comment, verified)
       VALUES ($1, $2, $3, $3, $3, $3, $3, $4, true)
       RETURNING id, created_at`,
      [params.id, userId, rating, comment]
    )

    const row = res.rows[0]
    return NextResponse.json({
      ok: true,
      review: {
        id: row.id,
        author: orderRes.rows[0].full_name || 'Buyer',
        avatar: '',
        rating,
        title: '',
        body: comment,
        date: new Date(row.created_at).toISOString().slice(0, 10),
        helpful: 0,
        verified: true,
      },
    })
  } catch (err: any) {
    if (err?.code === '23505') {
      return NextResponse.json({ error: 'You’ve already reviewed this product' }, { status: 409 })
    }
    console.error('[products/reviews] failed to create review:', err)
    return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 })
  }
}
