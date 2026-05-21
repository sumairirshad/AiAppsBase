import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getSessionUserId } from '@/lib/session'

export async function GET(req: NextRequest) {
  const userId = await getSessionUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userRes = await query("SELECT role FROM users WHERE id = $1", [userId])
  if ((userRes.rowCount ?? 0) === 0 || userRes.rows[0].role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const role = searchParams.get('role') || ''
  const search = searchParams.get('search') || ''

  const conditions: string[] = []
  const params: unknown[] = []
  let idx = 1

  if (role && role !== 'all') {
    conditions.push(`role = $${idx}`)
    params.push(role)
    idx++
  }

  if (search) {
    conditions.push(`(full_name ILIKE $${idx} OR email ILIKE $${idx})`)
    params.push(`%${search}%`)
    idx++
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  try {
    const res = await query(
      `SELECT id, full_name, email, role, is_verified, is_banned, is_suspended, created_at
       FROM users
       ${where}
       ORDER BY created_at DESC`,
      params
    )

    const users = res.rows.map((row) => ({
      id: row.id,
      name: row.full_name,
      email: row.email,
      role: row.role,
      isVerified: row.is_verified,
      isBanned: row.is_banned,
      isSuspended: row.is_suspended,
      memberSince: row.created_at,
      avatar: '',
    }))

    return NextResponse.json({ users })
  } catch (error) {
    console.error('Admin users error:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}
