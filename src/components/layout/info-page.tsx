import Link from 'next/link'

import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/icon'

export type InfoAction = { label: string; href: string; variant?: 'gradient' | 'outline' | 'default' }

/**
 * Shared, on-brand shell for informational / section pages so every nav and
 * footer link resolves to a polished, intentional page (never a 404).
 */
export function InfoPage({
  eyebrow, title, description, icon, children, actions,
}: {
  eyebrow: string
  title: React.ReactNode
  description: string
  icon?: string
  children?: React.ReactNode
  actions?: InfoAction[]
}) {
  return (
    <div className="relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[-15%] h-96 w-[700px] -translate-x-1/2 rounded-full bg-primary/15 blur-[120px]" />
        <div className="absolute inset-0 bg-grid bg-grid-pattern opacity-30 mask-fade-b" />
      </div>

      <div className="container max-w-4xl py-20 text-center sm:py-28">
        <Badge variant="brand" className="px-3 py-1">
          <Icon name={icon} className="size-3" /> {eyebrow}
        </Badge>
        <h1 className="mt-5 font-display text-4xl font-bold tracking-tight sm:text-5xl">{title}</h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">{description}</p>

        {actions && actions.length > 0 && (
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {actions.map((a) => (
              <Button key={a.href} variant={a.variant ?? 'default'} size="lg" asChild>
                <Link href={a.href}>{a.label}</Link>
              </Button>
            ))}
          </div>
        )}

        {children && <div className="mx-auto mt-14 max-w-3xl text-left">{children}</div>}
      </div>
    </div>
  )
}

/** A compact "we're building this" body for stub pages. */
export function BuildingNotice({ items }: { items: { icon?: string; title: string; description: string }[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {items.map((it) => (
        <div key={it.title} className={cn('rounded-xl border border-border bg-card p-5')}>
          <Icon name={it.icon} className="mb-3 size-5 text-primary" />
          <h3 className="font-semibold">{it.title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{it.description}</p>
        </div>
      ))}
    </div>
  )
}
