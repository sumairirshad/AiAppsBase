import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)

  const search = searchParams.get('search') || ''
  const category = searchParams.get('category') || ''
  const aiTool = searchParams.get('aiTool') || ''
  const techStack = searchParams.get('techStack') || ''
  const license = searchParams.get('license') || ''
  const minPrice = parseFloat(searchParams.get('minPrice') || '0')
  const maxPrice = parseFloat(searchParams.get('maxPrice') || '999999')
  const sort = searchParams.get('sort') || 'newest'

  const conditions: string[] = ["p.status = 'approved'"]
  const params: unknown[] = []
  let idx = 1

  if (search) {
    conditions.push(
      `(p.title ILIKE $${idx} OR p.description ILIKE $${idx} OR $${idx} ILIKE ANY(p.tags))`
    )
    params.push(`%${search}%`)
    idx++
  }

  if (category) {
    conditions.push(`p.category = $${idx}`)
    params.push(category)
    idx++
  }

  if (aiTool) {
    conditions.push(`$${idx} = ANY(p.ai_tools)`)
    params.push(aiTool)
    idx++
  }

  if (techStack) {
    conditions.push(`$${idx} = ANY(p.tech_stack)`)
    params.push(techStack)
    idx++
  }

  if (license) {
    conditions.push(`p.license_type = $${idx}`)
    params.push(license)
    idx++
  }

  conditions.push(`p.price >= $${idx}`)
  params.push(minPrice)
  idx++

  conditions.push(`p.price <= $${idx}`)
  params.push(maxPrice)
  idx++

  const orderMap: Record<string, string> = {
    newest: 'p.created_at DESC',
    'best-selling': 'sales_count DESC',
    'price-asc': 'p.price ASC',
    'price-desc': 'p.price DESC',
    'top-rated': 'rating DESC',
  }
  const orderBy = orderMap[sort] || 'p.created_at DESC'

  const whereClause = conditions.join(' AND ')

  try {
    const res = await query(
      `SELECT
        p.id, p.title, p.description, p.price, p.category,
        p.ai_tools, p.tech_stack, p.human_mod_level,
        p.screenshots, p.preview_url, p.license_type,
        p.status, p.featured, p.tags,
        p.created_at, p.updated_at,
        u.id AS seller_id, u.full_name AS seller_name,
        u.email AS seller_email, u.role AS seller_role,
        u.created_at AS seller_member_since,
        ROUND(COALESCE(AVG(r.rating), 0)::numeric, 1) AS rating,
        COUNT(DISTINCT r.id)::int AS review_count,
        COUNT(DISTINCT o.id)::int AS sales_count
      FROM products p
      LEFT JOIN users u ON p.seller_id = u.id
      LEFT JOIN reviews r ON p.id = r.product_id
      LEFT JOIN orders o ON p.id = o.product_id AND o.status = 'completed'
      WHERE ${whereClause}
      GROUP BY p.id, u.id
      ORDER BY ${orderBy}`,
      params
    )

    const products = res.rows.map(mapProduct)
    return NextResponse.json({ products })
  } catch (error) {
    console.error('Marketplace fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}

function mapProduct(row: Record<string, unknown>) {
  return {
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
      email: row.seller_email,
      role: row.seller_role,
      avatar: '',
      memberSince: row.seller_member_since,
    },
  }
}
