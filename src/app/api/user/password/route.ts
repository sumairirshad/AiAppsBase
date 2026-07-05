import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getSessionUserId } from '@/lib/session'
import { hashPassword, verifyPassword } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const userId = await getSessionUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const current = typeof body.current === 'string' ? body.current : ''
  const next = typeof body.next === 'string' ? body.next : ''
  if (next.length < 8) {
    return NextResponse.json({ error: 'New password must be at least 8 characters.' }, { status: 400 })
  }

  try {
    const res = await query(`SELECT password_hash FROM users WHERE id = $1`, [userId])
    if (res.rowCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const ok = await verifyPassword(current, res.rows[0].password_hash)
    if (!ok) return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 400 })

    const hash = await hashPassword(next)
    await query(`UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2`, [hash, userId])
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
