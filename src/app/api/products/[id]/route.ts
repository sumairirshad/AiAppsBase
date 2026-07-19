import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getSessionUserId } from '@/lib/session'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getSessionUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const res = await query('SELECT * FROM products WHERE id = $1 AND seller_id = $2', [params.id, userId])
  if ((res.rowCount ?? 0) === 0) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  return NextResponse.json({ product: res.rows[0] })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getSessionUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const existing = await query('SELECT id, status FROM products WHERE id = $1 AND seller_id = $2', [params.id, userId])
  if ((existing.rowCount ?? 0) === 0) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const title = String(body.title || '').trim()
  const description = String(body.description || '').trim()
  const category = String(body.category || '').trim()
  const humanModLevel = String(body.humanModLevel || '').trim()
  const licenseType = String(body.licenseType || '').trim()
  const previewUrl = body.previewUrl ? String(body.previewUrl).trim() : null
  const price = Number(body.price) || 0
  const tags = Array.isArray(body.tags) ? body.tags : []
  const aiTools = Array.isArray(body.aiTools) ? body.aiTools : []

  if (!title || !description || !category || !humanModLevel || !licenseType) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  try {
    // Edited content needs a fresh admin review before it goes live again.
    const res = await query(
      `UPDATE products SET
        title = $1, description = $2, category = $3, human_mod_level = $4,
        license_type = $5, preview_url = $6, price = $7, tags = $8, ai_tools = $9,
        status = CASE WHEN status = 'approved' THEN 'pending' ELSE status END,
        updated_at = NOW()
       WHERE id = $10 AND seller_id = $11
       RETURNING id`,
      [title, description, category, humanModLevel, licenseType, previewUrl, price, tags, aiTools, params.id, userId]
    )
    return NextResponse.json({ ok: true, id: res.rows[0].id })
  } catch {
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getSessionUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const existing = await query('SELECT id FROM products WHERE id = $1 AND seller_id = $2', [params.id, userId])
  if ((existing.rowCount ?? 0) === 0) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  try {
    await query('DELETE FROM products WHERE id = $1 AND seller_id = $2', [params.id, userId])
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    // FK violation (orders reference this product) — can't hard-delete purchase history.
    if (err?.code === '23503') {
      return NextResponse.json(
        { error: 'This product has orders and cannot be deleted. Suspend it instead by contacting support.' },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
  }
}
