import { NextRequest, NextResponse } from 'next/server'
import { query } from './db'

function clientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return req.headers.get('x-real-ip') || 'unknown'
}

/**
 * Fixed-window rate limit on `routeKey` for the requester's IP, backed by
 * Postgres so the count holds up across serverless instances (an in-memory
 * counter wouldn't). Returns a ready-to-return 429 response once `limit`
 * requests land within `windowSeconds`, or null if the request may proceed.
 */
export async function rateLimit(
  req: NextRequest,
  routeKey: string,
  limit: number,
  windowSeconds: number
): Promise<NextResponse | null> {
  const key = `${routeKey}:${clientIp(req)}`
  const res = await query<{ count: number; window_start: Date }>(
    `INSERT INTO rate_limits (key, count, window_start)
     VALUES ($1, 1, NOW())
     ON CONFLICT (key) DO UPDATE SET
       count = CASE WHEN rate_limits.window_start < NOW() - $2 * INTERVAL '1 second' THEN 1 ELSE rate_limits.count + 1 END,
       window_start = CASE WHEN rate_limits.window_start < NOW() - $2 * INTERVAL '1 second' THEN NOW() ELSE rate_limits.window_start END
     RETURNING count, window_start`,
    [key, windowSeconds]
  )

  const { count, window_start } = res.rows[0]
  if (count > limit) {
    const elapsedSeconds = (Date.now() - new Date(window_start).getTime()) / 1000
    const retryAfter = Math.max(1, Math.ceil(windowSeconds - elapsedSeconds))
    return NextResponse.json(
      { error: 'Too many requests. Please slow down and try again shortly.' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } }
    )
  }

  return null
}
