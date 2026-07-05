import { ArrowDownRight, ArrowUpRight } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'

export function StatCard({
  label, value, change, icon: Icon, prefix, suffix,
}: {
  label: string
  value: string | number
  change?: number
  icon: any
  prefix?: string
  suffix?: string
}) {
  const up = (change ?? 0) >= 0
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-4" />
        </span>
      </div>
      <div className="mt-3 font-display text-2xl font-bold sm:text-3xl">
        {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
      </div>
      {change !== undefined && (
        <div className="mt-1 flex items-center gap-1 text-xs">
          <span className={cn('inline-flex items-center gap-0.5 font-medium', up ? 'text-success' : 'text-destructive')}>
            {up ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
            {Math.abs(change)}%
          </span>
          <span className="text-muted-foreground">vs last month</span>
        </div>
      )}
    </Card>
  )
}
