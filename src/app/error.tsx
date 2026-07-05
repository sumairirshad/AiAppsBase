'use client'

import * as React from 'react'
import Link from 'next/link'
import { RefreshCw, Home, AlertTriangle } from 'lucide-react'

import { Button } from '@/components/ui/button'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  React.useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(error)
  }, [error])

  return (
    <div className="relative flex min-h-[80vh] items-center justify-center overflow-hidden px-4">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/3 h-96 w-[700px] -translate-x-1/2 rounded-full bg-destructive/10 blur-[120px]" />
        <div className="absolute inset-0 bg-grid bg-grid-pattern opacity-30 mask-fade-b" />
      </div>
      <div className="text-center">
        <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-destructive/10 text-destructive">
          <AlertTriangle className="size-8" />
        </div>
        <h1 className="mt-6 font-display text-2xl font-bold tracking-tight sm:text-3xl">Something went wrong</h1>
        <p className="mx-auto mt-3 max-w-md text-muted-foreground">
          An unexpected error occurred. You can try again, or head back home while we look into it.
        </p>
        {error.digest && <p className="mt-2 font-mono text-xs text-muted-foreground">Error ID: {error.digest}</p>}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button variant="gradient" size="lg" onClick={reset}><RefreshCw className="size-4" /> Try again</Button>
          <Button variant="outline" size="lg" asChild><Link href="/"><Home className="size-4" /> Back home</Link></Button>
        </div>
      </div>
    </div>
  )
}
