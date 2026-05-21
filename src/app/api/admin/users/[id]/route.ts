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

  const { action } = await req.json()

  const actionMap: Record<string, string> = {
    ban: 'UPDATE users SET is_banned = true WHERE id = $1',
    unban: 'UPDATE users SET is_banned = false WHERE id = $1',
    suspend: 'UPDATE users SET is_suspended = true WHERE id = $1',
    unsuspend: 'UPDATE users SET is_suspended = false WHERE id = $1',
  }

  const sql = actionMap[action]
  if (!sql) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  try {
    await query(sql, [params.id])
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Admin user update error:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}
