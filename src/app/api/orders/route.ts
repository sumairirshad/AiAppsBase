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
        o.id, o.amount, o.license_type, o.license_key, o.status, o.created_at,
        p.id AS product_id, p.title AS product_title, p.description AS product_description,
        p.price AS product_price, p.category AS product_category,
        p.screenshots AS product_screenshots, p.preview_url AS product_preview_url,
        p.ai_tools AS product_ai_tools, p.tech_stack AS product_tech_stack,
        p.human_mod_level AS product_human_mod_level,
        p.featured AS product_featured, p.tags AS product_tags,
        p.created_at AS product_created_at, p.updated_at AS product_updated_at,
        p.status AS product_status,
        (p.github_repo_name IS NOT NULL OR p.deliverable_remote_path IS NOT NULL) AS has_download,
        u.id AS seller_id, u.full_name AS seller_name
      FROM orders o
      JOIN products p ON o.product_id = p.id
      JOIN users u ON p.seller_id = u.id
      WHERE o.buyer_id = $1
      ORDER BY o.created_at DESC`,
      [userId]
    )

    const orders = res.rows.map((row) => ({
      id: row.id,
      productId: row.product_id,
      amount: Number(row.amount),
      licenseType: row.license_type,
      licenseKey: row.license_key,
      status: row.status,
      createdAt: row.created_at,
      hasDownload: row.has_download,
      product: {
        id: row.product_id,
        title: row.product_title,
        description: row.product_description,
        price: Number(row.product_price),
        category: row.product_category,
        aiTools: row.product_ai_tools,
        techStack: row.product_tech_stack,
        humanModLevel: row.product_human_mod_level,
        screenshots: row.product_screenshots,
        previewUrl: row.product_preview_url,
        licenseType: row.license_type,
        status: row.product_status,
        featured: row.product_featured,
        tags: row.product_tags,
        createdAt: row.product_created_at,
        updatedAt: row.product_updated_at,
        rating: 0,
        reviewCount: 0,
        salesCount: 0,
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

    return NextResponse.json({ orders })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const userId = await getSessionUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { productId, licenseType } = await req.json()

    if (!productId || !licenseType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const productRes = await query('SELECT id, price, seller_id FROM products WHERE id = $1 AND status = $2', [
      productId,
      'approved',
    ])
    if ((productRes.rowCount ?? 0) === 0) {
      return NextResponse.json({ error: 'Product not found or not available' }, { status: 404 })
    }

    const product = productRes.rows[0]
    const amount = Number(product.price)

    // This endpoint only creates orders directly for FREE products — paid
    // products must go through /api/checkout/create-session and Stripe.
    if (amount !== 0) {
      return NextResponse.json(
        { error: 'This product requires payment. Use checkout instead.' },
        { status: 402 }
      )
    }

    if (product.seller_id === userId) {
      return NextResponse.json({ error: 'Cannot claim your own product' }, { status: 403 })
    }

    const existing = await query('SELECT id FROM orders WHERE product_id = $1 AND buyer_id = $2', [
      productId,
      userId,
    ])
    if ((existing.rowCount ?? 0) > 0) {
      return NextResponse.json({ error: 'You already own this product' }, { status: 409 })
    }

    const res = await query(
      `INSERT INTO orders (product_id, buyer_id, amount, license_type)
       VALUES ($1, $2, $3, $4)
       RETURNING id, license_key`,
      [productId, userId, amount, licenseType]
    )

    await query('DELETE FROM cart_items WHERE user_id = $1 AND product_id = $2', [userId, productId])

    return NextResponse.json({ ok: true, orderId: res.rows[0].id, licenseKey: res.rows[0].license_key })
  } catch {
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}
