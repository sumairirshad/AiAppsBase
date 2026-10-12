import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getSessionUserId } from '@/lib/session'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const res = await query<{ version: string; notes: string[]; created_at: string }>(
    `SELECT version, notes, created_at FROM product_changelog WHERE product_id = $1 ORDER BY created_at DESC`,
    [params.id]
  )
  const entries = res.rows.map((r) => ({
    version: r.version,
    notes: r.notes,
    date: new Date(r.created_at).toISOString().slice(0, 10),
  }))
  return NextResponse.json({ entries })
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getSessionUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const version = typeof body?.version === 'string' ? body.version.trim() : ''
  const notesText = typeof body?.notes === 'string' ? body.notes : ''
  const notes = notesText
    .split('\n')
    .map((line: string) => line.trim())
    .filter(Boolean)

  if (!version) {
    return NextResponse.json({ error: 'Version is required' }, { status: 400 })
  }
  if (notes.length === 0) {
    return NextResponse.json({ error: 'Add at least one changelog note' }, { status: 400 })
  }

  const productRes = await query('SELECT id FROM products WHERE id = $1 AND seller_id = $2', [params.id, userId])
  if ((productRes.rowCount ?? 0) === 0) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const res = await query<{ created_at: string }>(
    `INSERT INTO product_changelog (product_id, version, notes) VALUES ($1, $2, $3) RETURNING created_at`,
    [params.id, version, notes]
  )

  return NextResponse.json({
    ok: true,
    entry: { version, notes, date: new Date(res.rows[0].created_at).toISOString().slice(0, 10) },
  })
}
