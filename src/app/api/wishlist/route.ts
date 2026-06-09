import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getSessionUserId } from '@/lib/session'

export async function GET() {
  const userId = await getSessionUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const res = await query(
      `SELECT
        w.id AS wishlist_id, w.created_at AS saved_at,
        p.id, p.title, p.description, p.price, p.category,
        p.ai_tools, p.tech_stack, p.human_mod_level,
        p.screenshots, p.preview_url, p.license_type,
        p.status, p.featured, p.tags,
        p.created_at, p.updated_at,
        u.id AS seller_id, u.full_name AS seller_name,
        ROUND(COALESCE(AVG(r.rating), 0)::numeric, 1) AS rating,
        COUNT(DISTINCT r.id)::int AS review_count,
        COUNT(DISTINCT o.id)::int AS sales_count
      FROM wishlists w
      JOIN products p ON w.product_id = p.id
      LEFT JOIN users u ON p.seller_id = u.id
      LEFT JOIN reviews r ON p.id = r.product_id
      LEFT JOIN orders o ON p.id = o.product_id AND o.status = 'completed'
      WHERE w.user_id = $1
      GROUP BY w.id, p.id, u.id
      ORDER BY w.created_at DESC`,
      [userId]
    )

    const items = res.rows.map((row) => ({
      wishlistId: row.wishlist_id,
      savedAt: row.saved_at,
      product: {
        id: row.id,
        title: row.title,
        description: row.description,
        price: Number(row.price),
        category: row.category,
        aiTools: row.ai_tools,
        techStack: row.tech_stack,
        humanModLevel: row.human_mod_level,
        screenshots: row.screenshots,
        previewUrl: row.preview_url,
        licenseType: row.license_type,
        status: row.status,
        featured: row.featured,
        tags: row.tags,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        rating: Number(row.rating),
        reviewCount: Number(row.review_count),
        salesCount: Number(row.sales_count),
        seller: {
          id: row.seller_id,
          name: row.seller_name,
          email: '',
          role: 'seller',
          avatar: '',
          memberSince: '',
        },
      },
    }))

    return NextResponse.json({ items, count: items.length })
  } catch (error) {
    console.error('Wishlist fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch wishlist' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const userId = await getSessionUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { productId } = await req.json()
    await query(
      'INSERT INTO wishlists (user_id, product_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [userId, productId]
    )
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Wishlist add error:', error)
    return NextResponse.json({ error: 'Failed to add to wishlist' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const userId = await getSessionUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { productId } = await req.json()
    await query('DELETE FROM wishlists WHERE user_id = $1 AND product_id = $2', [userId, productId])
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Wishlist delete error:', error)
    return NextResponse.json({ error: 'Failed to remove from wishlist' }, { status: 500 })
  }
}
