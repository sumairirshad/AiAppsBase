'use client'

import * as React from 'react'
import { RefreshCw, AlertTriangle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  React.useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="mx-auto max-w-7xl">
      <Card className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <span className="grid size-14 place-items-center rounded-2xl bg-destructive/10 text-destructive">
          <AlertTriangle className="size-7" />
        </span>
        <div>
          <h2 className="text-lg font-semibold">Something went wrong</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            This section couldn&apos;t load. You can try again, or refresh the page.
          </p>
          {error.digest && <p className="mt-2 font-mono text-xs text-muted-foreground">Error ID: {error.digest}</p>}
        </div>
        <Button variant="outline" onClick={reset}><RefreshCw className="size-4" /> Try again</Button>
      </Card>
    </div>
  )
}
