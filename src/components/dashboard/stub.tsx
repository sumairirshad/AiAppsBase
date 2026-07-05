import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Icon } from '@/components/icon'

export function DashboardStub({
  title, description, icon, backHref = '/panel',
}: {
  title: string
  description: string
  icon?: string
  backHref?: string
}) {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>
      <Card className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <span className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
          <Icon name={icon} className="size-7" />
        </span>
        <div>
          <h2 className="text-lg font-semibold">This section is coming together</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            We&apos;re polishing this part of the workspace. Everything you need to manage it will live here shortly.
          </p>
        </div>
        <Button variant="outline" asChild><Link href={backHref}>Back to dashboard</Link></Button>
      </Card>
    </div>
  )
}
