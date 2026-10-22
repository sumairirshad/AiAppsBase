import { NextResponse } from 'next/server'
import { getSessionUserId } from '@/lib/session'
import { listBuyerNotifications, markAllNotificationsRead } from '@/lib/notifications'

export async function GET() {
  const userId = await getSessionUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const notifications = await listBuyerNotifications(userId)
  return NextResponse.json({ notifications })
}

/** Marks every one of the caller's notifications read — used by the "mark all as read" action. */
export async function POST() {
  const userId = await getSessionUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  await markAllNotificationsRead(userId)
  return NextResponse.json({ ok: true })
}
