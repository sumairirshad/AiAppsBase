import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params

  try {
    const productRes = await query(
      `SELECT
        p.id, p.title, p.description, p.price, p.category,
        p.ai_tools, p.tech_stack, p.human_mod_level,
        p.screenshots, p.preview_url, p.license_type,
        p.status, p.featured, p.tags,
        p.created_at, p.updated_at,
        u.id AS seller_id, u.full_name AS seller_name,
        u.role AS seller_role,
        u.created_at AS seller_member_since,
        ROUND(COALESCE(AVG(r.rating), 0)::numeric, 1) AS rating,
        COUNT(DISTINCT r.id)::int AS review_count,
        COUNT(DISTINCT o.id)::int AS sales_count
      FROM products p
      LEFT JOIN users u ON p.seller_id = u.id
      LEFT JOIN reviews r ON p.id = r.product_id
      LEFT JOIN orders o ON p.id = o.product_id AND o.status = 'completed'
      WHERE p.id = $1
      GROUP BY p.id, u.id`,
      [id]
    )

    if ((productRes.rowCount ?? 0) === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const row = productRes.rows[0]

    const reviewsRes = await query(
      `SELECT
        r.id, r.rating, r.code_quality, r.design, r.documentation,
        r.value_for_money, r.comment, r.verified, r.helpful,
        r.seller_response, r.created_at,
        u.id AS user_id, u.full_name AS user_name
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.product_id = $1
      ORDER BY r.created_at DESC`,
      [id]
    )

    const product = {
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
        role: row.seller_role,
        avatar: '',
        memberSince: row.seller_member_since,
      },
    }

    const reviews = reviewsRes.rows.map((r) => ({
      id: r.id,
      productId: id,
      rating: r.rating,
      codeQuality: r.code_quality,
      design: r.design,
      documentation: r.documentation,
      valueForMoney: r.value_for_money,
      comment: r.comment,
      verified: r.verified,
      helpful: r.helpful,
      sellerResponse: r.seller_response,
      createdAt: r.created_at,
      user: {
        id: r.user_id,
        name: r.user_name,
        avatar: '',
        role: 'buyer',
        memberSince: '',
      },
    }))

    return NextResponse.json({ product, reviews })
  } catch (error) {
    console.error('Product fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 })
  }
}
