import { NextResponse } from 'next/server'
import { getSessionUserId } from '@/lib/session'
import { query } from '@/lib/db'

export async function GET() {
  const userId = await getSessionUserId()
  if (!userId) {
    return NextResponse.json({ user: null })
  }

  const res = await query('SELECT id, full_name, email, role FROM users WHERE id = $1', [userId])
  if ((res?.rowCount ?? 0) === 0) {
    return NextResponse.json({ user: null })
  }

  return NextResponse.json({ user: res.rows[0] })
}

export async function DELETE() {
  const { clearSession } = await import('@/lib/session')
  await clearSession()
  return NextResponse.json({ ok: true })
}
