import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getSessionUserId } from '@/lib/session'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getSessionUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userRes = await query("SELECT role FROM users WHERE id = $1", [userId])
  if ((userRes.rowCount ?? 0) === 0 || userRes.rows[0].role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { status } = await req.json()
  const allowed = ['approved', 'rejected', 'suspended', 'pending']
  if (!allowed.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  try {
    await query('UPDATE products SET status = $1 WHERE id = $2', [status, params.id])
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Admin product update error:', error)
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
  }
}
