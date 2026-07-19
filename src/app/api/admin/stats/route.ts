import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getSessionUserId } from '@/lib/session'
import { getPlatformFeePercent } from '@/lib/payouts'

export async function GET() {
  const userId = await getSessionUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userRes = await query("SELECT role FROM users WHERE id = $1", [userId])
  if ((userRes.rowCount ?? 0) === 0 || userRes.rows[0].role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const [usersRes, productsRes, ordersRes, pendingRes] = await Promise.all([
      query('SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE role = $1)::int AS sellers FROM users', ['seller']),
      query("SELECT COUNT(*)::int AS total FROM products WHERE status = 'approved'"),
      query("SELECT COALESCE(SUM(amount), 0) AS gmv, COUNT(*)::int AS total_sales FROM orders WHERE status = 'completed'"),
      query("SELECT COUNT(*)::int AS pending FROM products WHERE status = 'pending'"),
    ])

    const stats = {
      totalUsers: usersRes.rows[0].total,
      totalSellers: usersRes.rows[0].sellers,
      totalProducts: productsRes.rows[0].total,
      gmv: Number(ordersRes.rows[0].gmv),
      totalSales: ordersRes.rows[0].total_sales,
      platformRevenue: Number(ordersRes.rows[0].gmv) * (getPlatformFeePercent() / 100),
      pendingProducts: pendingRes.rows[0].pending,
    }

    const activityRes = await query(
      `(SELECT 'order' AS type, o.id, p.title AS context, u.full_name AS actor, o.created_at AS ts
        FROM orders o JOIN products p ON o.product_id = p.id JOIN users u ON o.buyer_id = u.id
        ORDER BY o.created_at DESC LIMIT 5)
       UNION ALL
       (SELECT 'submission' AS type, p.id::text, p.title AS context, u.full_name AS actor, p.created_at AS ts
        FROM products p JOIN users u ON p.seller_id = u.id
        WHERE p.status = 'pending'
        ORDER BY p.created_at DESC LIMIT 5)
       ORDER BY ts DESC LIMIT 8`
    )

    return NextResponse.json({ stats, activity: activityRes.rows })
  } catch (error) {
    console.error('Admin stats error:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
