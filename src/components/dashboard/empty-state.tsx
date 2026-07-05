import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Icon } from '@/components/icon'

export function EmptyState({
  icon, title, description, actionLabel, actionHref, className,
}: {
  icon?: string
  title: string
  description: string
  actionLabel?: string
  actionHref?: string
  className?: string
}) {
  return (
    <div className={`flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center ${className ?? ''}`}>
      <span className="mb-4 grid size-12 place-items-center rounded-2xl bg-muted text-muted-foreground">
        <Icon name={icon} className="size-6" />
      </span>
      <h3 className="font-semibold">{title}</h3>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      {actionLabel && actionHref && (
        <Button variant="outline" className="mt-5" asChild><Link href={actionHref}>{actionLabel}</Link></Button>
      )}
    </div>
  )
}
