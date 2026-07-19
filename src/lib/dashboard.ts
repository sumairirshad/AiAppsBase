import { query } from '@/lib/db'
import { getSessionUserId } from '@/lib/session'
import { gradientFor } from '@/lib/marketplace-config'

/**
 * Server data-access for the seller & buyer dashboards. Every function reads
 * live data for the signed-in user and returns safe empty defaults when there
 * is no session or the database is unreachable — no mock data anywhere.
 */

export type CurrentUser = { id: string; full_name: string; email: string; role: string; github_username: string | null }

export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    const id = await getSessionUserId()
    if (!id) return null
    const res = await query(
      `SELECT id, full_name, email, role, github_username FROM users WHERE id = $1`, [id]
    )
    return res.rowCount ? (res.rows[0] as CurrentUser) : null
  } catch {
    return null
  }
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/* --------------------------------- Seller -------------------------------- */

export type SellerStats = {
  revenue: number; sales: number; products: number; customers: number
  avgRating: number; conversion: number; payout: number; pending: number
}

export async function getSellerStats(userId: string): Promise<SellerStats> {
  const empty: SellerStats = { revenue: 0, sales: 0, products: 0, customers: 0, avgRating: 0, conversion: 0, payout: 0, pending: 0 }
  try {
    const res = await query(
      `SELECT
         COALESCE((SELECT SUM(o.amount) FROM orders o JOIN products p ON o.product_id=p.id
                   WHERE p.seller_id=$1 AND o.status='completed'),0)::float AS revenue,
         COALESCE((SELECT COUNT(*) FROM orders o JOIN products p ON o.product_id=p.id
                   WHERE p.seller_id=$1 AND o.status='completed'),0)::int AS sales,
         COALESCE((SELECT COUNT(*) FROM products WHERE seller_id=$1),0)::int AS products,
         COALESCE((SELECT COUNT(DISTINCT o.buyer_id) FROM orders o JOIN products p ON o.product_id=p.id
                   WHERE p.seller_id=$1 AND o.status='completed'),0)::int AS customers,
         COALESCE((SELECT AVG(r.rating) FROM reviews r JOIN products p ON r.product_id=p.id
                   WHERE p.seller_id=$1),0)::float AS avg_rating,
         COALESCE((SELECT SUM(o.amount) FROM orders o JOIN products p ON o.product_id=p.id
                   WHERE p.seller_id=$1 AND o.status='completed' AND o.created_at < NOW() - INTERVAL '14 days'),0)::float AS payout,
         COALESCE((SELECT SUM(o.amount) FROM orders o JOIN products p ON o.product_id=p.id
                   WHERE p.seller_id=$1 AND o.status='completed' AND o.created_at >= NOW() - INTERVAL '14 days'),0)::float AS pending`,
      [userId]
    )
    const r = res.rows[0] as any
    return {
      revenue: Math.round(r.revenue), sales: r.sales, products: r.products, customers: r.customers,
      avgRating: Math.round(r.avg_rating * 10) / 10, conversion: 0,
      payout: Math.round(r.payout), pending: Math.round(r.pending),
    }
  } catch { return empty }
}

export async function getSellerRevenueSeries(userId: string): Promise<{ month: string; revenue: number; sales: number }[]> {
  try {
    const res = await query(
      `SELECT date_trunc('month', o.created_at) AS m,
              SUM(o.amount)::float AS revenue, COUNT(*)::int AS sales
       FROM orders o JOIN products p ON o.product_id=p.id
       WHERE p.seller_id=$1 AND o.status='completed' AND o.created_at > NOW() - INTERVAL '9 months'
       GROUP BY 1 ORDER BY 1`, [userId]
    )
    return res.rows.map((r: any) => ({
      month: MONTHS[new Date(r.m).getMonth()], revenue: Math.round(r.revenue), sales: r.sales,
    }))
  } catch { return [] }
}

export async function getSellerCategorySplit(userId: string): Promise<{ name: string; value: number }[]> {
  try {
    const res = await query(
      `SELECT p.category AS name, COUNT(*)::int AS value
       FROM orders o JOIN products p ON o.product_id=p.id
       WHERE p.seller_id=$1 AND o.status='completed'
       GROUP BY p.category ORDER BY value DESC LIMIT 5`, [userId]
    )
    const total = res.rows.reduce((a: number, b: any) => a + b.value, 0) || 1
    return res.rows.map((r: any) => ({ name: r.name, value: Math.round((r.value / total) * 100) }))
  } catch { return [] }
}

export async function getSellerTopProducts(userId: string) {
  try {
    const res = await query(
      `SELECT p.id, p.title, p.price::float AS price,
              COALESCE(agg.rating,0)::float AS rating,
              COALESCE(ord.sales,0)::int AS sales,
              COALESCE(ord.revenue,0)::float AS revenue
       FROM products p
       LEFT JOIN (SELECT product_id, AVG(rating) rating FROM reviews GROUP BY product_id) agg ON agg.product_id=p.id
       LEFT JOIN (SELECT product_id, COUNT(*) sales, SUM(amount) revenue FROM orders WHERE status='completed' GROUP BY product_id) ord ON ord.product_id=p.id
       WHERE p.seller_id=$1 ORDER BY ord.revenue DESC NULLS LAST, p.created_at DESC LIMIT 5`, [userId]
    )
    return res.rows.map((r: any) => ({
      id: r.id, title: r.title, gradient: gradientFor(r.id), price: Number(r.price) || 0,
      sales: r.sales, revenue: Math.round(r.revenue), rating: Math.round(r.rating * 10) / 10,
    }))
  } catch { return [] }
}

export async function getSellerOrders(userId: string, limit = 50) {
  try {
    const res = await query(
      `SELECT o.id, o.amount::float AS amount, o.status, o.created_at, o.license_type,
              p.id AS product_id, p.title AS product, u.full_name AS buyer
       FROM orders o JOIN products p ON o.product_id=p.id JOIN users u ON o.buyer_id=u.id
       WHERE p.seller_id=$1 ORDER BY o.created_at DESC LIMIT $2`, [userId, limit]
    )
    return res.rows.map((r: any) => ({
      id: r.id, product: r.product, productId: r.product_id, gradient: gradientFor(r.product_id),
      buyer: r.buyer, amount: Math.round(Number(r.amount)), status: r.status, license: r.license_type,
      date: new Date(r.created_at).toISOString().slice(0, 10),
    }))
  } catch { return [] }
}

export async function getSellerCustomers(userId: string) {
  try {
    const res = await query(
      `SELECT u.id, u.full_name, u.email,
              COUNT(*)::int AS orders, SUM(o.amount)::float AS spent, MAX(o.created_at) AS last_order
       FROM orders o JOIN products p ON o.product_id=p.id JOIN users u ON o.buyer_id=u.id
       WHERE p.seller_id=$1 AND o.status='completed'
       GROUP BY u.id, u.full_name, u.email ORDER BY spent DESC LIMIT 50`, [userId]
    )
    return res.rows.map((r: any) => ({
      id: r.id, name: r.full_name, email: r.email, orders: r.orders,
      spent: Math.round(Number(r.spent)), lastOrder: new Date(r.last_order).toISOString().slice(0, 10),
    }))
  } catch { return [] }
}

export async function getSellerReviews(userId: string) {
  try {
    const res = await query(
      `SELECT r.id, r.rating, r.comment, r.created_at, r.helpful, r.verified,
              u.full_name AS author, p.title AS product
       FROM reviews r JOIN products p ON r.product_id=p.id JOIN users u ON r.user_id=u.id
       WHERE p.seller_id=$1 ORDER BY r.created_at DESC LIMIT 50`, [userId]
    )
    return res.rows.map((r: any) => ({
      id: r.id, rating: r.rating, comment: r.comment, product: r.product, author: r.author,
      helpful: r.helpful, verified: r.verified, date: new Date(r.created_at).toISOString().slice(0, 10),
    }))
  } catch { return [] }
}

/* --------------------------------- Buyer --------------------------------- */

export type BuyerStats = { purchases: number; spent: number; downloads: number; wishlist: number }

export async function getBuyerStats(userId: string): Promise<BuyerStats> {
  try {
    const res = await query(
      `SELECT
        COALESCE((SELECT COUNT(*) FROM orders WHERE buyer_id=$1),0)::int AS purchases,
        COALESCE((SELECT SUM(amount) FROM orders WHERE buyer_id=$1),0)::float AS spent,
        COALESCE((SELECT COUNT(*) FROM orders WHERE buyer_id=$1 AND status='completed'),0)::int AS downloads,
        COALESCE((SELECT COUNT(*) FROM wishlists WHERE user_id=$1),0)::int AS wishlist`, [userId]
    )
    const r = res.rows[0] as any
    return { purchases: r.purchases, spent: Math.round(r.spent), downloads: r.downloads, wishlist: r.wishlist }
  } catch { return { purchases: 0, spent: 0, downloads: 0, wishlist: 0 } }
}

export async function getBuyerOrders(userId: string, limit = 50) {
  try {
    const res = await query(
      `SELECT o.id, o.amount::float AS amount, o.status, o.license_type, o.license_key, o.created_at,
              p.id AS product_id, p.title AS product, p.github_repo_name, p.deliverable_remote_path
       FROM orders o JOIN products p ON o.product_id=p.id
       WHERE o.buyer_id=$1 ORDER BY o.created_at DESC LIMIT $2`, [userId, limit]
    )
    return res.rows.map((r: any) => ({
      id: r.id, productId: r.product_id, product: r.product, gradient: gradientFor(r.product_id),
      amount: Math.round(Number(r.amount)), status: r.status, license: r.license_type,
      licenseKey: r.license_key, downloadable: Boolean(r.github_repo_name || r.deliverable_remote_path),
      date: new Date(r.created_at).toISOString().slice(0, 10),
    }))
  } catch { return [] }
}

export async function getBuyerWishlist(userId: string) {
  try {
    const res = await query(
      `SELECT p.id, p.title, p.price::float AS price, p.category,
              COALESCE((SELECT AVG(rating) FROM reviews WHERE product_id=p.id),0)::float AS rating
       FROM wishlists w JOIN products p ON w.product_id=p.id
       WHERE w.user_id=$1 ORDER BY w.created_at DESC LIMIT 24`, [userId]
    )
    return res.rows.map((r: any) => ({
      id: r.id, title: r.title, gradient: gradientFor(r.id), price: Number(r.price) || 0,
      category: r.category, rating: Math.round(r.rating * 10) / 10,
    }))
  } catch { return [] }
}

export async function getBuyerReviews(userId: string) {
  try {
    const res = await query(
      `SELECT r.id, r.rating, r.comment, r.created_at, p.id AS product_id, p.title AS product
       FROM reviews r JOIN products p ON r.product_id=p.id
       WHERE r.user_id=$1 ORDER BY r.created_at DESC LIMIT 50`, [userId]
    )
    return res.rows.map((r: any) => ({
      id: r.id, rating: r.rating, comment: r.comment, product: r.product, productId: r.product_id,
      date: new Date(r.created_at).toISOString().slice(0, 10),
    }))
  } catch { return [] }
}

/* --------------------------------- Admin --------------------------------- */

export type AdminFinances = { revenue: number; commission: number; net: number; sales: number; pending: number }

export async function getAdminFinances(): Promise<AdminFinances> {
  try {
    const res = await query(
      `SELECT
        COALESCE((SELECT SUM(amount) FROM orders WHERE status='completed'),0)::float AS revenue,
        COALESCE((SELECT COUNT(*) FROM orders WHERE status='completed'),0)::int AS sales,
        COALESCE((SELECT SUM(amount) FROM orders WHERE status='completed' AND created_at >= NOW() - INTERVAL '14 days'),0)::float AS pending`
    )
    const r = res.rows[0] as any
    const revenue = Math.round(r.revenue)
    const commission = Math.round(revenue * 0.1)
    return { revenue, commission, net: revenue - commission, sales: r.sales, pending: Math.round(r.pending) }
  } catch { return { revenue: 0, commission: 0, net: 0, sales: 0, pending: 0 } }
}

export async function getRecentTransactions(limit = 20) {
  try {
    const res = await query(
      `SELECT o.id, o.amount::float AS amount, o.status, o.created_at,
              p.title AS product, b.full_name AS buyer, s.full_name AS seller
       FROM orders o
       JOIN products p ON o.product_id = p.id
       JOIN users b ON o.buyer_id = b.id
       JOIN users s ON p.seller_id = s.id
       ORDER BY o.created_at DESC LIMIT $1`, [limit]
    )
    return res.rows.map((r: any) => ({
      id: r.id, amount: Math.round(Number(r.amount)), status: r.status,
      product: r.product, buyer: r.buyer, seller: r.seller,
      date: new Date(r.created_at).toISOString().slice(0, 10),
    }))
  } catch { return [] }
}

export async function getBuyerSpendSeries(userId: string) {
  try {
    const res = await query(
      `SELECT date_trunc('month', created_at) AS m, SUM(amount)::float AS spent
       FROM orders WHERE buyer_id=$1 AND created_at > NOW() - INTERVAL '6 months'
       GROUP BY 1 ORDER BY 1`, [userId]
    )
    return res.rows.map((r: any) => ({ month: MONTHS[new Date(r.m).getMonth()], spent: Math.round(r.spent) }))
  } catch { return [] }
}
