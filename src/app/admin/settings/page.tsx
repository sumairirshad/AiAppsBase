import { Info, Percent } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PageHead } from '@/components/dashboard/page-head'
import { EmptyState } from '@/components/dashboard/empty-state'
import { SettingsForm } from '@/components/dashboard/settings-form'
import { getCurrentUser } from '@/lib/dashboard'

export const dynamic = 'force-dynamic'

export default async function AdminSettingsPage() {
  const user = await getCurrentUser()

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHead title="Settings" description="Manage your admin account and view platform configuration." />

      {user ? (
        <SettingsForm user={user} />
      ) : (
        <EmptyState icon="Info" title="Sign in required" description="Sign in to manage your account settings." actionLabel="Sign in" actionHref="/auth/login" />
      )}

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Percent className="size-4" /> Platform configuration</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <p className="font-medium">Platform commission</p>
              <p className="text-muted-foreground">Applied to every completed booking, shown on the Finances page.</p>
            </div>
            <Badge variant="brand">10%</Badge>
          </div>
          <div className="flex items-start gap-2 rounded-lg border border-dashed border-border p-3 text-muted-foreground">
            <Info className="mt-0.5 size-4 shrink-0" />
            <p>Roles &amp; permissions, email templates, and system-wide preferences aren&apos;t backed by persisted configuration in this app yet — coming soon.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
