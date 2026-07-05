import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getSessionUserId } from '@/lib/session'

export async function GET() {
  const userId = await getSessionUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const res = await query(
      `SELECT id, full_name, email, role, github_username, is_verified, created_at FROM users WHERE id = $1`,
      [userId]
    )
    if (res.rowCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ user: res.rows[0] })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const userId = await getSessionUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const fullName = typeof body.full_name === 'string' ? body.full_name.trim() : ''
  if (fullName.length < 2) {
    return NextResponse.json({ error: 'Please enter your full name.' }, { status: 400 })
  }

  try {
    const res = await query(
      `UPDATE users SET full_name = $1, updated_at = NOW() WHERE id = $2
       RETURNING id, full_name, email, role`,
      [fullName, userId]
    )
    return NextResponse.json({ user: res.rows[0] })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
