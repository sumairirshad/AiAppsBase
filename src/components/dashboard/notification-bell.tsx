'use client'

import * as React from 'react'
import Link from 'next/link'
import { Bell, PackageCheck } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

type BuyerNotification = {
  id: string
  title: string
  body: string
  linkUrl: string
  read: boolean
  createdAt: string
  productName: string
  newVersion: string
  previousVersion: string | null
}

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

/**
 * New-version announcements only (type: 'new_version') — deliberately
 * distinct from payment receipts, which are delivered by email, not here,
 * so a buyer never confuses "your card was charged" with "a product you
 * own was updated".
 */
export function NotificationBell() {
  const [notifications, setNotifications] = React.useState<BuyerNotification[]>([])
  const [loading, setLoading] = React.useState(true)
  const [open, setOpen] = React.useState(false)

  const load = React.useCallback(async () => {
    try {
      const res = await fetch('/api/notifications')
      if (!res.ok) return
      const data = await res.json()
      setNotifications(data.notifications ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    load()
    const interval = setInterval(load, 60_000)
    return () => clearInterval(interval)
  }, [load])

  const unreadCount = notifications.filter((n) => !n.read).length

  const markRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
    await fetch(`/api/notifications/${id}/read`, { method: 'POST' }).catch(() => {})
  }

  const markAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    await fetch('/api/notifications', { method: 'POST' }).catch(() => {})
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="size-5" />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <span className="text-sm font-semibold">Notifications</span>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="text-xs text-primary hover:underline">
              Mark all as read
            </button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">Loading…</div>
          ) : notifications.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">No notifications yet</div>
          ) : (
            notifications.map((n) => (
              <Link
                key={n.id}
                href={n.linkUrl}
                onClick={() => {
                  if (!n.read) markRead(n.id)
                  setOpen(false)
                }}
                className={cn(
                  'flex gap-3 border-b border-border/60 px-3 py-3 text-sm transition-colors last:border-0 hover:bg-accent',
                  !n.read && 'bg-primary/5'
                )}
              >
                <PackageCheck className="mt-0.5 size-4 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className={cn('leading-snug', !n.read && 'font-semibold')}>
                    New version available: {n.productName}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {n.previousVersion ? `v${n.previousVersion} → v${n.newVersion}` : `Now at v${n.newVersion}`}
                    {' · '}
                    {timeAgo(n.createdAt)}
                  </p>
                </div>
                {!n.read && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />}
              </Link>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
