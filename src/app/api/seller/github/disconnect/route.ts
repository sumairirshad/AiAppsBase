import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getSessionUserId } from '@/lib/session'

export async function DELETE() {
  const userId = await getSessionUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await query(
    'UPDATE users SET github_username = NULL, github_access_token = NULL WHERE id = $1',
    [userId]
  )

  return NextResponse.json({ ok: true })
}
