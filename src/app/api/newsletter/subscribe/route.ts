import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 })
  }

  try {
    await query(
      `INSERT INTO newsletter_subscribers (email) VALUES ($1) ON CONFLICT (email) DO NOTHING`,
      [email]
    )
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[newsletter/subscribe] failed:', error)
    return NextResponse.json({ error: 'Could not subscribe right now. Please try again.' }, { status: 500 })
  }
}
