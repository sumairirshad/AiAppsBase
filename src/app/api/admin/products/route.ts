import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getSessionUserId } from '@/lib/session'

async function requireAdmin() {
  const userId = await getSessionUserId()
  if (!userId) return null
  const res = await query("SELECT role FROM users WHERE id = $1", [userId])
  if ((res.rowCount ?? 0) === 0 || res.rows[0].role !== 'admin') return null
  return userId
}

export async function GET(req: NextRequest) {
  const adminId = await requireAdmin()
  if (!adminId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || ''

  const conditions: string[] = []
  const params: unknown[] = []

  if (status && status !== 'all') {
    conditions.push(`p.status = $1`)
    params.push(status)
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  try {
    const res = await query(
      `SELECT
        p.id, p.title, p.description, p.price, p.category,
        p.ai_tools, p.tech_stack, p.human_mod_level,
        p.screenshots, p.license_type, p.status, p.tags,
        p.created_at, p.updated_at,
        u.id AS seller_id, u.full_name AS seller_name, u.email AS seller_email
      FROM products p
      LEFT JOIN users u ON p.seller_id = u.id
      ${where}
      ORDER BY p.created_at DESC`,
      params
    )

    const products = res.rows.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      price: Number(row.price),
      category: row.category,
      aiTools: row.ai_tools,
      techStack: row.tech_stack,
      humanModLevel: row.human_mod_level,
      screenshots: row.screenshots,
      licenseType: row.license_type,
      status: row.status,
      tags: row.tags,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      seller: {
        id: row.seller_id,
        name: row.seller_name,
        email: row.seller_email,
      },
    }))

    return NextResponse.json({ products })
  } catch (error) {
    console.error('Admin products error:', error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}
