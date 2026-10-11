import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getSessionUserId } from '@/lib/session'

export async function GET() {
  const userId = await getSessionUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const res = await query(
      `SELECT id, full_name, email, pending_email, role, github_username, is_verified, created_at,
         bio, location, website_url, email_notifications_enabled
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

  // Every field below is optional; an omitted key is left unchanged. This is
  // what lets the notification toggle PATCH just { email_notifications_enabled }
  // on its own, without resending the rest of the profile form.
  const optional = (v: unknown) => (typeof v === 'string' ? v.trim() : undefined)
  const fullName = optional(body.full_name)
  const bio = optional(body.bio)
  const location = optional(body.location)
  let website = optional(body.website_url)
  const emailNotificationsEnabled = typeof body.email_notifications_enabled === 'boolean' ? body.email_notifications_enabled : undefined

  if (fullName !== undefined && fullName.length < 2) {
    return NextResponse.json({ error: 'Please enter your full name.' }, { status: 400 })
  }

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
      `UPDATE users SET
         full_name = CASE WHEN $3::boolean THEN $1 ELSE full_name END,
         bio = CASE WHEN $4::boolean THEN NULLIF($5, '') ELSE bio END,
         location = CASE WHEN $6::boolean THEN NULLIF($7, '') ELSE location END,
         website_url = CASE WHEN $8::boolean THEN NULLIF($9, '') ELSE website_url END,
         email_notifications_enabled = CASE WHEN $10::boolean THEN $11::boolean ELSE email_notifications_enabled END,
         updated_at = NOW()
       WHERE id = $2
       RETURNING id, full_name, email, role, bio, location, website_url, email_notifications_enabled`,
      [
        fullName ?? '', userId, fullName !== undefined,
        bio !== undefined, bio ?? '',
        location !== undefined, location ?? '',
        website !== undefined, website ?? '',
        emailNotificationsEnabled !== undefined, emailNotificationsEnabled ?? false,
      ]
    )
    return NextResponse.json({ user: res.rows[0] })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
