import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getSessionUserId } from '@/lib/session'

export async function GET() {
  const userId = await getSessionUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const statsRes = await query(
      `SELECT
        COALESCE(SUM(o.amount), 0) AS total_revenue,
        COUNT(DISTINCT o.id)::int AS total_sales,
        COUNT(DISTINCT p.id)::int AS active_products,
        ROUND(COALESCE(AVG(r.rating), 0)::numeric, 1) AS avg_rating
      FROM users u
      LEFT JOIN products p ON p.seller_id = u.id AND p.status = 'approved'
      LEFT JOIN orders o ON o.product_id = p.id AND o.status = 'completed'
      LEFT JOIN reviews r ON r.product_id = p.id
      WHERE u.id = $1`,
      [userId]
    )

    const recentSalesRes = await query(
      `SELECT
        o.id, o.amount, o.created_at,
        p.title AS product_title,
        b.full_name AS buyer_name
      FROM orders o
      JOIN products p ON o.product_id = p.id
      JOIN users b ON o.buyer_id = b.id
      WHERE p.seller_id = $1
      ORDER BY o.created_at DESC
      LIMIT 10`,
      [userId]
    )

    const stats = statsRes.rows[0]

    return NextResponse.json({
      totalRevenue: Number(stats.total_revenue),
      totalSales: stats.total_sales,
      activeProducts: stats.active_products,
      avgRating: Number(stats.avg_rating),
      recentSales: recentSalesRes.rows.map((row) => ({
        id: row.id,
        product: row.product_title,
        buyer: row.buyer_name,
        amount: Number(row.amount),
        date: row.created_at,
      })),
    })
  } catch (error) {
    console.error('Seller stats error:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
