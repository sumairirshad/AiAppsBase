import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getSessionUserId } from '@/lib/session'

export async function GET() {
  const userId = await getSessionUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const res = await query(
      `SELECT id, full_name, email, role, github_username, is_verified, created_at, bio, location, website_url
       FROM users WHERE id = $1`,
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

  // Public storefront fields — optional; omitted keys are left unchanged.
  const optional = (v: unknown) => (typeof v === 'string' ? v.trim() : undefined)
  const bio = optional(body.bio)
  const location = optional(body.location)
  let website = optional(body.website_url)

  if (bio !== undefined && bio.length > 1000) {
    return NextResponse.json({ error: 'Bio must be 1000 characters or fewer.' }, { status: 400 })
  }
  if (location !== undefined && location.length > 100) {
    return NextResponse.json({ error: 'Location must be 100 characters or fewer.' }, { status: 400 })
  }
  if (website) {
    if (!/^https?:\/\//i.test(website)) website = `https://${website}`
    try {
      const url = new URL(website)
      if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new Error()
      website = url.toString()
    } catch {
      return NextResponse.json({ error: 'Please enter a valid website URL.' }, { status: 400 })
    }
    if (website.length > 200) {
      return NextResponse.json({ error: 'Website URL is too long.' }, { status: 400 })
    }
  }

  try {
    const res = await query(
      `UPDATE users SET full_name = $1,
         bio = CASE WHEN $3::boolean THEN NULLIF($4, '') ELSE bio END,
         location = CASE WHEN $5::boolean THEN NULLIF($6, '') ELSE location END,
         website_url = CASE WHEN $7::boolean THEN NULLIF($8, '') ELSE website_url END,
         updated_at = NOW()
       WHERE id = $2
       RETURNING id, full_name, email, role, bio, location, website_url`,
      [fullName, userId, bio !== undefined, bio ?? '', location !== undefined, location ?? '', website !== undefined, website ?? '']
    )
    return NextResponse.json({ user: res.rows[0] })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
