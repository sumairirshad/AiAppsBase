import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getSessionUserId } from '@/lib/session'

export async function DELETE() {
  const userId = await getSessionUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const roleRes = await query('SELECT role FROM users WHERE id = $1', [userId])
  const role = roleRes.rows[0]?.role
  if (role !== 'seller' && role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await query(
    'UPDATE users SET github_username = NULL, github_access_token = NULL WHERE id = $1',
    [userId]
  )

  return NextResponse.json({ ok: true })
}
