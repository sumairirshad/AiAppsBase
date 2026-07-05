import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getSessionUserId } from '@/lib/session'
import { getCart } from '@/lib/cart'

export async function GET() {
  const userId = await getSessionUserId()
  if (!userId) return NextResponse.json({ items: [], count: 0, subtotal: 0 })
  const cart = await getCart(userId)
  return NextResponse.json(cart)
}

export async function POST(req: NextRequest) {
  const userId = await getSessionUserId()
  if (!userId) return NextResponse.json({ error: 'Please sign in to add items to your cart.' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const productId = typeof body.productId === 'string' ? body.productId : ''
  const licenseType = typeof body.licenseType === 'string' && body.licenseType ? body.licenseType : 'Commercial'
  if (!productId) return NextResponse.json({ error: 'productId is required' }, { status: 400 })

  try {
    const prod = await query(`SELECT seller_id FROM products WHERE id = $1 AND status = 'approved'`, [productId])
    if (prod.rowCount === 0) return NextResponse.json({ error: 'Product not found or not available' }, { status: 404 })
    if (prod.rows[0].seller_id === userId) return NextResponse.json({ error: 'You cannot add your own product to the cart.' }, { status: 403 })

    const owned = await query(`SELECT 1 FROM orders WHERE product_id = $1 AND buyer_id = $2`, [productId, userId])
    if ((owned.rowCount ?? 0) > 0) return NextResponse.json({ error: 'You already own this product.' }, { status: 409 })

    await query(
      `INSERT INTO cart_items (user_id, product_id, license_type) VALUES ($1, $2, $3)
       ON CONFLICT (user_id, product_id) DO UPDATE SET license_type = EXCLUDED.license_type`,
      [userId, productId, licenseType]
    )
    const cart = await getCart(userId)
    return NextResponse.json({ ok: true, count: cart.count })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const userId = await getSessionUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const productId = typeof body.productId === 'string' ? body.productId : ''
  if (!productId) return NextResponse.json({ error: 'productId is required' }, { status: 400 })

  try {
    await query(`DELETE FROM cart_items WHERE user_id = $1 AND product_id = $2`, [userId, productId])
    const cart = await getCart(userId)
    return NextResponse.json({ ok: true, count: cart.count })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
