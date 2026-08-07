import { query } from './db'

/**
 * Server data-access for the admin panel. Every function queries the live
 * database and returns a safe empty default on failure — no mock data.
 * Mirrors the pattern established in src/lib/dashboard.ts.
 */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function paginate(page = 1, pageSize = 20) {
  const safePage = Math.max(1, page)
  const safeSize = Math.min(100, Math.max(1, pageSize))
  return { limit: safeSize, offset: (safePage - 1) * safeSize }
}

/* -------------------------------------------------------------------------- */
/*                                  Dashboard                                 */
/* -------------------------------------------------------------------------- */

export type AdminDashboardStats = {
  totalUsers: number; totalSellers: number; activeSellers: number; pendingSellerApprovals: number
  suspendedUsers: number; blockedUsers: number; bannedUsers: number; recentSignups: number
  totalOrders: number; completedOrders: number; refundedOrders: number; disputedOrders: number
  totalRevenue: number; totalReviews: number
}

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const empty: AdminDashboardStats = {
    totalUsers: 0, totalSellers: 0, activeSellers: 0, pendingSellerApprovals: 0,
    suspendedUsers: 0, blockedUsers: 0, bannedUsers: 0, recentSignups: 0,
    totalOrders: 0, completedOrders: 0, refundedOrders: 0, disputedOrders: 0,
    totalRevenue: 0, totalReviews: 0,
  }
  try {
    const [usersRes, ordersRes, reviewsRes] = await Promise.all([
      query(`SELECT
        COUNT(*)::int AS total_users,
        COUNT(*) FILTER (WHERE role = 'seller')::int AS total_sellers,
        COUNT(*) FILTER (WHERE role = 'seller' AND seller_status = 'approved' AND account_status = 'active')::int AS active_sellers,
        COUNT(*) FILTER (WHERE role = 'seller' AND seller_status = 'pending')::int AS pending_seller_approvals,
        COUNT(*) FILTER (WHERE account_status = 'suspended')::int AS suspended_users,
        COUNT(*) FILTER (WHERE account_status = 'blocked')::int AS blocked_users,
        COUNT(*) FILTER (WHERE account_status = 'banned')::int AS banned_users,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days')::int AS recent_signups
      FROM users`),
      query(`SELECT
        COUNT(*)::int AS total_orders,
        COUNT(*) FILTER (WHERE status = 'completed')::int AS completed_orders,
        COUNT(*) FILTER (WHERE status = 'refunded')::int AS refunded_orders,
        COUNT(*) FILTER (WHERE status = 'disputed')::int AS disputed_orders,
        COALESCE(SUM(amount) FILTER (WHERE status = 'completed'), 0)::float AS total_revenue
      FROM orders`),
      query(`SELECT COUNT(*)::int AS total FROM reviews`),
    ])
    const u = usersRes.rows[0] as any
    const o = ordersRes.rows[0] as any
    return {
      totalUsers: u.total_users, totalSellers: u.total_sellers, activeSellers: u.active_sellers,
      pendingSellerApprovals: u.pending_seller_approvals, suspendedUsers: u.suspended_users,
      blockedUsers: u.blocked_users, bannedUsers: u.banned_users, recentSignups: u.recent_signups,
      totalOrders: o.total_orders, completedOrders: o.completed_orders, refundedOrders: o.refunded_orders,
      disputedOrders: o.disputed_orders, totalRevenue: Math.round(o.total_revenue),
      totalReviews: (reviewsRes.rows[0] as any).total,
    }
  } catch { return empty }
}

export async function getAdminGrowthSeries(): Promise<{ label: string; users: number; sellers: number }[]> {
  try {
    const res = await query(
      `SELECT date_trunc('month', created_at) AS m,
              COUNT(*)::int AS users,
              COUNT(*) FILTER (WHERE role = 'seller')::int AS sellers
       FROM users WHERE created_at > NOW() - INTERVAL '9 months'
       GROUP BY 1 ORDER BY 1`
    )
    return res.rows.map((r: any) => ({ label: MONTHS[new Date(r.m).getMonth()], users: r.users, sellers: r.sellers }))
  } catch { return [] }
}

export async function getAdminRevenueSeries(): Promise<{ month: string; revenue: number }[]> {
  try {
    const res = await query(
      `SELECT date_trunc('month', created_at) AS m,
              COALESCE(SUM(amount) FILTER (WHERE status = 'completed'), 0)::float AS revenue
       FROM orders WHERE created_at > NOW() - INTERVAL '9 months'
       GROUP BY 1 ORDER BY 1`
    )
    return res.rows.map((r: any) => ({ month: MONTHS[new Date(r.m).getMonth()], revenue: Math.round(r.revenue) }))
  } catch { return [] }
}

export async function getOrderStatusDistribution(): Promise<{ name: string; value: number }[]> {
  try {
    const res = await query(`SELECT status AS name, COUNT(*)::int AS value FROM orders GROUP BY status ORDER BY value DESC`)
    return res.rows as any
  } catch { return [] }
}

export type AdminActivityItem = { type: string; id: string; context: string; actor: string; ts: string }

export async function getAdminRecentActivity(limit = 8): Promise<AdminActivityItem[]> {
  try {
    const res = await query(
      `(SELECT 'order' AS type, o.id, p.title AS context, u.full_name AS actor, o.created_at AS ts
        FROM orders o JOIN products p ON o.product_id = p.id JOIN users u ON o.buyer_id = u.id
        ORDER BY o.created_at DESC LIMIT 5)
       UNION ALL
       (SELECT 'submission' AS type, p.id::text, p.title AS context, u.full_name AS actor, p.created_at AS ts
        FROM products p JOIN users u ON p.seller_id = u.id
        WHERE p.status = 'pending' ORDER BY p.created_at DESC LIMIT 5)
       UNION ALL
       (SELECT 'signup' AS type, u.id::text, u.role AS context, u.full_name AS actor, u.created_at AS ts
        FROM users u ORDER BY u.created_at DESC LIMIT 5)
       ORDER BY ts DESC LIMIT $1`,
      [limit]
    )
    return res.rows as any
  } catch { return [] }
}

export async function getLatestReviews(limit = 5) {
  try {
    const res = await query(
      `SELECT r.id, r.rating, r.comment, r.created_at, u.full_name AS author, p.title AS product, p.id AS product_id
       FROM reviews r JOIN users u ON r.user_id = u.id JOIN products p ON r.product_id = p.id
       ORDER BY r.created_at DESC LIMIT $1`,
      [limit]
    )
    return res.rows.map((r: any) => ({ ...r, date: new Date(r.created_at).toISOString().slice(0, 10) }))
  } catch { return [] }
}

export async function getSystemHealth() {
  const start = Date.now()
  try {
    await query('SELECT 1')
    const dbLatencyMs = Date.now() - start
    const [pendingProducts, pendingSellers] = await Promise.all([
      query(`SELECT COUNT(*)::int AS c FROM products WHERE status = 'pending'`),
      query(`SELECT COUNT(*)::int AS c FROM users WHERE role = 'seller' AND seller_status = 'pending'`),
    ])
    return {
      dbOk: true, dbLatencyMs,
      pendingProducts: (pendingProducts.rows[0] as any).c,
      pendingSellers: (pendingSellers.rows[0] as any).c,
    }
  } catch {
    return { dbOk: false, dbLatencyMs: Date.now() - start, pendingProducts: 0, pendingSellers: 0 }
  }
}

/* -------------------------------------------------------------------------- */
/*                                    Users                                   */
/* -------------------------------------------------------------------------- */

export type AdminUserRow = {
  id: string; name: string; email: string; role: string; isVerified: boolean
  accountStatus: string; sellerStatus: string | null; memberSince: string
}

const USER_SORT_COLUMNS: Record<string, string> = {
  created_at: 'u.created_at', name: 'u.full_name', email: 'u.email', role: 'u.role',
}

export async function listAdminUsers(opts: {
  search?: string; role?: string; status?: string
  sortBy?: string; sortDir?: 'asc' | 'desc'; page?: number; pageSize?: number
}): Promise<{ users: AdminUserRow[]; total: number }> {
  const conditions: string[] = []
  const params: unknown[] = []
  let idx = 1

  if (opts.role && opts.role !== 'all') { conditions.push(`u.role = $${idx++}`); params.push(opts.role) }
  if (opts.status && opts.status !== 'all') { conditions.push(`u.account_status = $${idx++}`); params.push(opts.status) }
  if (opts.search) { conditions.push(`(u.full_name ILIKE $${idx} OR u.email ILIKE $${idx})`); params.push(`%${opts.search}%`); idx++ }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  const sortCol = USER_SORT_COLUMNS[opts.sortBy ?? 'created_at'] ?? 'u.created_at'
  const sortDir = opts.sortDir === 'asc' ? 'ASC' : 'DESC'
  const { limit, offset } = paginate(opts.page, opts.pageSize)

  try {
    const [rowsRes, countRes] = await Promise.all([
      query(
        `SELECT u.id, u.full_name, u.email, u.role, u.is_verified, u.account_status, u.seller_status, u.created_at
         FROM users u ${where} ORDER BY ${sortCol} ${sortDir} LIMIT $${idx} OFFSET $${idx + 1}`,
        [...params, limit, offset]
      ),
      query(`SELECT COUNT(*)::int AS total FROM users u ${where}`, params),
    ])
    const users = rowsRes.rows.map((r: any) => ({
      id: r.id, name: r.full_name, email: r.email, role: r.role, isVerified: r.is_verified,
      accountStatus: r.account_status, sellerStatus: r.seller_status, memberSince: r.created_at,
    }))
    return { users, total: (countRes.rows[0] as any).total }
  } catch { return { users: [], total: 0 } }
}

export async function getAdminUserDetail(id: string) {
  try {
    const userRes = await query(
      `SELECT id, full_name, email, role, is_verified, account_status, seller_status, created_at, github_username
       FROM users WHERE id = $1`,
      [id]
    )
    if (userRes.rowCount === 0) return null
    const user = userRes.rows[0] as any

    const [orders, reviews, products, auditLog] = await Promise.all([
      query(
        `SELECT o.id, o.amount::float AS amount, o.status, o.created_at, o.license_type, p.title AS product, p.id AS product_id
         FROM orders o JOIN products p ON o.product_id = p.id WHERE o.buyer_id = $1 ORDER BY o.created_at DESC LIMIT 20`,
        [id]
      ),
      query(
        `SELECT r.id, r.rating, r.comment, r.created_at, p.title AS product, p.id AS product_id
         FROM reviews r JOIN products p ON r.product_id = p.id WHERE r.user_id = $1 ORDER BY r.created_at DESC LIMIT 20`,
        [id]
      ),
      user.role === 'seller'
        ? query(
            `SELECT p.id, p.title, p.status, p.price::float AS price, p.created_at,
                    COALESCE(o.sales, 0)::int AS sales, COALESCE(o.revenue, 0)::float AS revenue
             FROM products p
             LEFT JOIN (SELECT product_id, COUNT(*) sales, SUM(amount) revenue FROM orders WHERE status = 'completed' GROUP BY product_id) o
               ON o.product_id = p.id
             WHERE p.seller_id = $1 ORDER BY p.created_at DESC LIMIT 20`,
            [id]
          )
        : Promise.resolve({ rows: [] } as any),
      query(
        `SELECT a.id, a.action, a.reason, a.notes, a.created_at, u.full_name AS admin_name
         FROM audit_logs a JOIN users u ON a.admin_id = u.id
         WHERE a.target_type = 'user' AND a.target_id = $1 ORDER BY a.created_at DESC LIMIT 20`,
        [id]
      ),
    ])

    return {
      id: user.id, name: user.full_name, email: user.email, role: user.role,
      isVerified: user.is_verified, accountStatus: user.account_status, sellerStatus: user.seller_status,
      memberSince: user.created_at, githubUsername: user.github_username,
      orders: orders.rows.map((r: any) => ({ ...r, date: new Date(r.created_at).toISOString().slice(0, 10) })),
      reviews: reviews.rows.map((r: any) => ({ ...r, date: new Date(r.created_at).toISOString().slice(0, 10) })),
      products: products.rows,
      auditLog: auditLog.rows.map((r: any) => ({ ...r, date: new Date(r.created_at).toLocaleString() })),
    }
  } catch { return null }
}

/* -------------------------------------------------------------------------- */
/*                              Sellers (Providers)                           */
/* -------------------------------------------------------------------------- */

export async function listSellers(opts: {
  search?: string; status?: string; page?: number; pageSize?: number
}) {
  const conditions: string[] = [`u.role = 'seller'`]
  const params: unknown[] = []
  let idx = 1

  if (opts.status && opts.status !== 'all') { conditions.push(`u.seller_status = $${idx++}`); params.push(opts.status) }
  if (opts.search) { conditions.push(`(u.full_name ILIKE $${idx} OR u.email ILIKE $${idx})`); params.push(`%${opts.search}%`); idx++ }

  const where = `WHERE ${conditions.join(' AND ')}`
  const { limit, offset } = paginate(opts.page, opts.pageSize)

  try {
    const [rowsRes, countRes] = await Promise.all([
      query(
        `SELECT u.id, u.full_name, u.email, u.seller_status, u.account_status, u.created_at,
                COALESCE(pc.product_count, 0)::int AS product_count,
                COALESCE(rv.avg_rating, 0)::float AS avg_rating,
                COALESCE(rv.review_count, 0)::int AS review_count,
                COALESCE(o.completed_orders, 0)::int AS completed_orders,
                COALESCE(o.revenue, 0)::float AS revenue
         FROM users u
         LEFT JOIN (SELECT seller_id, COUNT(*) product_count FROM products GROUP BY seller_id) pc ON pc.seller_id = u.id
         LEFT JOIN (SELECT p.seller_id, AVG(r.rating) avg_rating, COUNT(r.id) review_count
                    FROM reviews r JOIN products p ON r.product_id = p.id GROUP BY p.seller_id) rv ON rv.seller_id = u.id
         LEFT JOIN (SELECT p.seller_id, COUNT(o.id) completed_orders, SUM(o.amount) revenue
                    FROM orders o JOIN products p ON o.product_id = p.id WHERE o.status = 'completed' GROUP BY p.seller_id) o
           ON o.seller_id = u.id
         ${where} ORDER BY u.created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
        [...params, limit, offset]
      ),
      query(`SELECT COUNT(*)::int AS total FROM users u ${where}`, params),
    ])
    const sellers = rowsRes.rows.map((r: any) => ({
      id: r.id, name: r.full_name, email: r.email, sellerStatus: r.seller_status, accountStatus: r.account_status,
      memberSince: r.created_at, productCount: r.product_count, avgRating: Math.round(r.avg_rating * 10) / 10,
      reviewCount: r.review_count, completedOrders: r.completed_orders, revenue: Math.round(r.revenue),
    }))
    return { sellers, total: (countRes.rows[0] as any).total }
  } catch { return { sellers: [], total: 0 } }
}

export async function getSellerDetail(id: string) {
  try {
    const userRes = await query(
      `SELECT id, full_name, email, role, is_verified, account_status, seller_status, created_at
       FROM users WHERE id = $1 AND role = 'seller'`,
      [id]
    )
    if (userRes.rowCount === 0) return null
    const seller = userRes.rows[0] as any

    const [statsRes, products, reviews, auditLog] = await Promise.all([
      query(
        `SELECT
           COALESCE((SELECT SUM(o.amount) FROM orders o JOIN products p ON o.product_id = p.id
                     WHERE p.seller_id = $1 AND o.status = 'completed'), 0)::float AS revenue,
           COALESCE((SELECT COUNT(*) FROM orders o JOIN products p ON o.product_id = p.id
                     WHERE p.seller_id = $1 AND o.status = 'completed'), 0)::int AS sales,
           COALESCE((SELECT COUNT(*) FROM products WHERE seller_id = $1), 0)::int AS products,
           COALESCE((SELECT AVG(r.rating) FROM reviews r JOIN products p ON r.product_id = p.id
                     WHERE p.seller_id = $1), 0)::float AS avg_rating,
           COALESCE((SELECT COUNT(*) FROM reviews r JOIN products p ON r.product_id = p.id
                     WHERE p.seller_id = $1), 0)::int AS review_count`,
        [id]
      ),
      query(
        `SELECT p.id, p.title, p.status, p.price::float AS price, p.created_at,
                COALESCE(o.sales, 0)::int AS sales, COALESCE(o.revenue, 0)::float AS revenue
         FROM products p
         LEFT JOIN (SELECT product_id, COUNT(*) sales, SUM(amount) revenue FROM orders WHERE status = 'completed' GROUP BY product_id) o
           ON o.product_id = p.id
         WHERE p.seller_id = $1 ORDER BY p.created_at DESC LIMIT 50`,
        [id]
      ),
      query(
        `SELECT r.id, r.rating, r.comment, r.created_at, u.full_name AS author, p.title AS product
         FROM reviews r JOIN products p ON r.product_id = p.id JOIN users u ON r.user_id = u.id
         WHERE p.seller_id = $1 ORDER BY r.created_at DESC LIMIT 20`,
        [id]
      ),
      query(
        `SELECT a.id, a.action, a.reason, a.notes, a.created_at, u.full_name AS admin_name
         FROM audit_logs a JOIN users u ON a.admin_id = u.id
         WHERE a.target_type = 'seller' AND a.target_id = $1 ORDER BY a.created_at DESC LIMIT 20`,
        [id]
      ),
    ])
    const s = statsRes.rows[0] as any
    return {
      id: seller.id, name: seller.full_name, email: seller.email, isVerified: seller.is_verified,
      accountStatus: seller.account_status, sellerStatus: seller.seller_status, memberSince: seller.created_at,
      revenue: Math.round(s.revenue), sales: s.sales, productCount: s.products,
      avgRating: Math.round(s.avg_rating * 10) / 10, reviewCount: s.review_count,
      products: products.rows,
      reviews: reviews.rows.map((r: any) => ({ ...r, date: new Date(r.created_at).toISOString().slice(0, 10) })),
      auditLog: auditLog.rows.map((r: any) => ({ ...r, date: new Date(r.created_at).toLocaleString() })),
    }
  } catch { return null }
}

/* -------------------------------------------------------------------------- */
/*                              Orders (Bookings)                             */
/* -------------------------------------------------------------------------- */

export async function listAdminOrders(opts: {
  search?: string; status?: string; page?: number; pageSize?: number
}) {
  const conditions: string[] = []
  const params: unknown[] = []
  let idx = 1

  if (opts.status && opts.status !== 'all') { conditions.push(`o.status = $${idx++}`); params.push(opts.status) }
  if (opts.search) {
    conditions.push(`(p.title ILIKE $${idx} OR b.full_name ILIKE $${idx} OR o.id ILIKE $${idx})`)
    params.push(`%${opts.search}%`); idx++
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  const { limit, offset } = paginate(opts.page, opts.pageSize)

  try {
    const [rowsRes, countRes] = await Promise.all([
      query(
        `SELECT o.id, o.amount::float AS amount, o.status, o.license_type, o.created_at,
                p.id AS product_id, p.title AS product,
                b.id AS buyer_id, b.full_name AS buyer, b.email AS buyer_email,
                s.id AS seller_id, s.full_name AS seller
         FROM orders o
         JOIN products p ON o.product_id = p.id
         JOIN users b ON o.buyer_id = b.id
         JOIN users s ON p.seller_id = s.id
         ${where} ORDER BY o.created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
        [...params, limit, offset]
      ),
      query(
        `SELECT COUNT(*)::int AS total FROM orders o JOIN products p ON o.product_id = p.id JOIN users b ON o.buyer_id = b.id ${where}`,
        params
      ),
    ])
    const orders = rowsRes.rows.map((r: any) => ({
      ...r, amount: Math.round(Number(r.amount)), date: new Date(r.created_at).toISOString().slice(0, 10),
    }))
    return { orders, total: (countRes.rows[0] as any).total }
  } catch { return { orders: [], total: 0 } }
}

export async function getAdminOrderDetail(id: string) {
  try {
    const res = await query(
      `SELECT o.id, o.amount::float AS amount, o.status, o.license_type, o.license_key, o.created_at,
              p.id AS product_id, p.title AS product, p.category,
              b.id AS buyer_id, b.full_name AS buyer, b.email AS buyer_email,
              s.id AS seller_id, s.full_name AS seller, s.email AS seller_email
       FROM orders o
       JOIN products p ON o.product_id = p.id
       JOIN users b ON o.buyer_id = b.id
       JOIN users s ON p.seller_id = s.id
       WHERE o.id = $1`,
      [id]
    )
    if (res.rowCount === 0) return null
    const r = res.rows[0] as any
    return { ...r, amount: Math.round(Number(r.amount)), date: new Date(r.created_at).toLocaleString() }
  } catch { return null }
}

/* -------------------------------------------------------------------------- */
/*                                   Reviews                                  */
/* -------------------------------------------------------------------------- */

export async function listAdminReviews(opts: {
  search?: string; rating?: number; page?: number; pageSize?: number
}) {
  const conditions: string[] = []
  const params: unknown[] = []
  let idx = 1

  if (opts.rating) { conditions.push(`r.rating = $${idx++}`); params.push(opts.rating) }
  if (opts.search) {
    conditions.push(`(r.comment ILIKE $${idx} OR p.title ILIKE $${idx} OR u.full_name ILIKE $${idx})`)
    params.push(`%${opts.search}%`); idx++
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  const { limit, offset } = paginate(opts.page, opts.pageSize)

  try {
    const [rowsRes, countRes] = await Promise.all([
      query(
        `SELECT r.id, r.rating, r.comment, r.verified, r.helpful, r.created_at,
                u.id AS author_id, u.full_name AS author, u.email AS author_email,
                p.id AS product_id, p.title AS product, s.full_name AS seller
         FROM reviews r
         JOIN users u ON r.user_id = u.id
         JOIN products p ON r.product_id = p.id
         JOIN users s ON p.seller_id = s.id
         ${where} ORDER BY r.created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
        [...params, limit, offset]
      ),
      query(
        `SELECT COUNT(*)::int AS total FROM reviews r JOIN users u ON r.user_id = u.id JOIN products p ON r.product_id = p.id ${where}`,
        params
      ),
    ])
    const reviews = rowsRes.rows.map((r: any) => ({ ...r, date: new Date(r.created_at).toISOString().slice(0, 10) }))
    return { reviews, total: (countRes.rows[0] as any).total }
  } catch { return { reviews: [], total: 0 } }
}

/* -------------------------------------------------------------------------- */
/*                            Notifications (derived)                         */
/* -------------------------------------------------------------------------- */

export type AdminNotification = {
  id: string; type: 'seller_pending' | 'product_pending' | 'signup' | 'low_review'
  title: string; description: string; href: string; ts: string
}

export async function getAdminNotificationsFeed(): Promise<AdminNotification[]> {
  try {
    const [pendingSellers, pendingProducts, signups, lowReviews] = await Promise.all([
      query(`SELECT id, full_name, created_at FROM users WHERE role = 'seller' AND seller_status = 'pending' ORDER BY created_at DESC LIMIT 10`),
      query(`SELECT p.id, p.title, p.created_at, u.full_name AS seller FROM products p JOIN users u ON p.seller_id = u.id WHERE p.status = 'pending' ORDER BY p.created_at DESC LIMIT 10`),
      query(`SELECT id, full_name, role, created_at FROM users WHERE created_at >= NOW() - INTERVAL '2 days' ORDER BY created_at DESC LIMIT 10`),
      query(`SELECT r.id, r.rating, p.title AS product, u.full_name AS author, r.created_at
             FROM reviews r JOIN products p ON r.product_id = p.id JOIN users u ON r.user_id = u.id
             WHERE r.rating <= 2 AND r.created_at >= NOW() - INTERVAL '14 days' ORDER BY r.created_at DESC LIMIT 10`),
    ])

    const items: AdminNotification[] = [
      ...pendingSellers.rows.map((r: any) => ({
        id: `seller-${r.id}`, type: 'seller_pending' as const,
        title: 'New seller application', description: `${r.full_name} applied to become a seller`,
        href: `/admin/sellers/${r.id}`, ts: r.created_at,
      })),
      ...pendingProducts.rows.map((r: any) => ({
        id: `product-${r.id}`, type: 'product_pending' as const,
        title: 'Product awaiting review', description: `"${r.title}" submitted by ${r.seller}`,
        href: `/admin/products`, ts: r.created_at,
      })),
      ...signups.rows.map((r: any) => ({
        id: `signup-${r.id}`, type: 'signup' as const,
        title: 'New signup', description: `${r.full_name} joined as a ${r.role}`,
        href: `/admin/users/${r.id}`, ts: r.created_at,
      })),
      ...lowReviews.rows.map((r: any) => ({
        id: `review-${r.id}`, type: 'low_review' as const,
        title: `Low rating (${r.rating}★)`, description: `${r.author} rated "${r.product}"`,
        href: `/admin/reviews`, ts: r.created_at,
      })),
    ]

    return items.sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime()).slice(0, 30)
  } catch { return [] }
}

/* -------------------------------------------------------------------------- */
/*                                 Audit logs                                 */
/* -------------------------------------------------------------------------- */

export async function getOrdersForExport(limit = 5000) {
  try {
    const res = await query(
      `SELECT o.id, o.amount::float AS amount, o.status, o.license_type, o.created_at,
              p.title AS product, b.full_name AS buyer, b.email AS buyer_email,
              s.full_name AS seller, s.email AS seller_email
       FROM orders o
       JOIN products p ON o.product_id = p.id
       JOIN users b ON o.buyer_id = b.id
       JOIN users s ON p.seller_id = s.id
       ORDER BY o.created_at DESC LIMIT $1`,
      [limit]
    )
    return res.rows as any[]
  } catch { return [] }
}

export async function listAuditLogs(opts: {
  action?: string; targetType?: string; page?: number; pageSize?: number
}) {
  const conditions: string[] = []
  const params: unknown[] = []
  let idx = 1

  if (opts.action && opts.action !== 'all') { conditions.push(`a.action = $${idx++}`); params.push(opts.action) }
  if (opts.targetType && opts.targetType !== 'all') { conditions.push(`a.target_type = $${idx++}`); params.push(opts.targetType) }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  const { limit, offset } = paginate(opts.page, opts.pageSize)

  try {
    const [rowsRes, countRes] = await Promise.all([
      query(
        `SELECT a.id, a.action, a.target_type, a.target_id, a.reason, a.notes,
                a.previous_value, a.new_value, a.ip_address, a.created_at,
                u.full_name AS admin_name, u.email AS admin_email
         FROM audit_logs a JOIN users u ON a.admin_id = u.id
         ${where} ORDER BY a.created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
        [...params, limit, offset]
      ),
      query(`SELECT COUNT(*)::int AS total FROM audit_logs a ${where}`, params),
    ])
    const logs = rowsRes.rows.map((r: any) => ({ ...r, date: new Date(r.created_at).toLocaleString() }))
    return { logs, total: (countRes.rows[0] as any).total }
  } catch { return { logs: [], total: 0 } }
}
