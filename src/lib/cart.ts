import { query } from '@/lib/db'
import { gradientFor } from '@/lib/marketplace-config'

export type CartItem = {
  id: string
  productId: string
  title: string
  price: number
  category: string
  license: string
  gradient: string
  owner: string
  ownedAlready: boolean
}

export type Cart = { items: CartItem[]; count: number; subtotal: number }

/** Full cart for a user, joined to live product + seller data. */
export async function getCart(userId: string): Promise<Cart> {
  try {
    const res = await query(
      `SELECT c.id, c.license_type, p.id AS product_id, p.title, p.price::float AS price,
              p.category, u.full_name AS seller, u.github_username AS handle,
              EXISTS (SELECT 1 FROM orders o WHERE o.product_id = p.id AND o.buyer_id = $1) AS owned
       FROM cart_items c
       JOIN products p ON c.product_id = p.id
       JOIN users u ON p.seller_id = u.id
       WHERE c.user_id = $1
       ORDER BY c.created_at DESC`,
      [userId]
    )
    const items: CartItem[] = res.rows.map((r: any) => ({
      id: r.id,
      productId: r.product_id,
      title: r.title,
      price: Number(r.price) || 0,
      category: r.category,
      license: r.license_type,
      gradient: gradientFor(r.product_id),
      owner: r.handle || String(r.seller).split(' ')[0].toLowerCase(),
      ownedAlready: Boolean(r.owned),
    }))
    const subtotal = items.reduce((a, b) => a + b.price, 0)
    return { items, count: items.length, subtotal }
  } catch {
    return { items: [], count: 0, subtotal: 0 }
  }
}
