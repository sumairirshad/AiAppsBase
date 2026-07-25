import Link from 'next/link'
import { Store, Package, UserPlus, StarOff } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PageHead } from '@/components/dashboard/page-head'
import { EmptyState } from '@/components/dashboard/empty-state'
import { getAdminNotificationsFeed } from '@/lib/admin-data'
import { timeAgo } from '@/lib/utils'

export const dynamic = 'force-dynamic'

const typeMeta: Record<string, { icon: any; badge: 'warning' | 'brand' | 'success' | 'destructive'; label: string }> = {
  seller_pending: { icon: Store, badge: 'warning', label: 'Provider application' },
  product_pending: { icon: Package, badge: 'brand', label: 'Product review' },
  signup: { icon: UserPlus, badge: 'success', label: 'New signup' },
  low_review: { icon: StarOff, badge: 'destructive', label: 'Low rating' },
}

export default async function AdminNotificationsPage() {
  const notifications = await getAdminNotificationsFeed()

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHead title="Notifications Center" description="Live feed of items that need admin attention: approvals, submissions, signups, and low ratings." />

      {notifications.length === 0 ? (
        <EmptyState icon="Bell" title="All caught up" description="No pending approvals, new submissions, or flagged activity right now." />
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const meta = typeMeta[n.type]
            const Icon = meta.icon
            return (
              <Link key={n.id} href={n.href}>
                <Card className="transition-colors hover:border-primary/40">
                  <CardContent className="flex items-start gap-3 p-4">
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{n.title}</p>
                        <Badge variant={meta.badge} className="text-[10px]">{meta.label}</Badge>
                      </div>
                      <p className="mt-0.5 truncate text-sm text-muted-foreground">{n.description}</p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(n.ts)}</span>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
