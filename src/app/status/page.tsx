import type { Metadata } from 'next'
import { CheckCircle2, XCircle, ExternalLink } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Icon } from '@/components/icon'
import { query } from '@/lib/db'

export const metadata: Metadata = {
  title: 'System status',
  description: 'A live check of the AIAppsBase platform and database, plus links to the status pages of the third-party services we depend on.',
}

export const dynamic = 'force-dynamic'

async function checkDatabase(): Promise<boolean> {
  try {
    await query('SELECT 1')
    return true
  } catch {
    return false
  }
}

function StatusRow({ name, ok, note }: { name: string; ok: boolean; note: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-4 last:border-0">
      <div>
        <p className="font-medium">{name}</p>
        <p className="text-sm text-muted-foreground">{note}</p>
      </div>
      {ok ? (
        <Badge variant="success"><CheckCircle2 className="size-3" /> Operational</Badge>
      ) : (
        <Badge variant="destructive"><XCircle className="size-3" /> Issue detected</Badge>
      )}
    </div>
  )
}

export default async function StatusPage() {
  const dbOk = await checkDatabase()
  const checkedAt = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })

  return (
    <div className="relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[-15%] h-96 w-[700px] -translate-x-1/2 rounded-full bg-primary/15 blur-[120px]" />
        <div className="absolute inset-0 bg-grid bg-grid-pattern opacity-30 mask-fade-b" />
      </div>

      <div className="container max-w-3xl py-20 text-center sm:py-24">
        <Badge variant="brand" className="px-3 py-1"><Icon name="Activity" className="size-3" /> Reliability</Badge>
        <h1 className="mt-5 font-display text-4xl font-bold tracking-tight sm:text-5xl">System status</h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
          A live check of AIAppsBase&apos;s own systems, run when this page loads — not a simulated or
          historical report.
        </p>
      </div>

      <div className="container max-w-3xl pb-8">
        <Card className="overflow-hidden">
          <StatusRow name="AIAppsBase platform" ok={true} note="You&apos;re loading this page, so the app is responding." />
          <StatusRow name="Database" ok={dbOk} note={dbOk ? 'Connected and responding to queries.' : 'Could not reach the database just now.'} />
        </Card>
        <p className="mt-3 text-center text-xs text-muted-foreground">Checked at {checkedAt}. We don&apos;t yet keep a historical incident log — this reflects right now only.</p>
      </div>

      <div className="container max-w-3xl pb-20">
        <h2 className="mb-3 text-center text-sm font-semibold text-muted-foreground">Third-party dependencies</h2>
        <Card className="divide-y divide-border p-0">
          {[
            { name: 'Stripe (payments)', href: 'https://status.stripe.com' },
            { name: 'GitHub (repo delivery)', href: 'https://www.githubstatus.com' },
          ].map((s) => (
            <a key={s.name} href={s.href} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between gap-4 px-5 py-4 text-sm transition-colors hover:bg-accent">
              <span>{s.name}</span>
              <span className="inline-flex items-center gap-1 text-primary">View status page <ExternalLink className="size-3.5" /></span>
            </a>
          ))}
        </Card>
      </div>
    </div>
  )
}
