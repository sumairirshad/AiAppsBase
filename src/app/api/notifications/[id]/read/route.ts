import { NextRequest, NextResponse } from 'next/server'
import { getSessionUserId } from '@/lib/session'
import { markNotificationRead } from '@/lib/notifications'

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getSessionUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  // Scoped to buyerId inside markNotificationRead — a buyer can never mark
  // (or even discover the existence of) another buyer's notification by id.
  const ok = await markNotificationRead(userId, params.id)
  if (!ok) {
    return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
  }
  return NextResponse.json({ ok: true })
}
