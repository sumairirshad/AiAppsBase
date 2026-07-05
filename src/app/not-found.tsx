import Link from 'next/link'
import { Home, Search, ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="relative flex min-h-[80vh] items-center justify-center overflow-hidden px-4">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/3 h-96 w-[700px] -translate-x-1/2 rounded-full bg-primary/15 blur-[120px]" />
        <div className="absolute inset-0 bg-grid bg-grid-pattern opacity-30 mask-fade-b" />
      </div>
      <div className="text-center">
        <p className="font-display text-[8rem] font-bold leading-none text-gradient-brand sm:text-[12rem]">404</p>
        <h1 className="mt-2 font-display text-2xl font-bold tracking-tight sm:text-3xl">Page not found</h1>
        <p className="mx-auto mt-3 max-w-md text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or has moved. Let&apos;s get you back on track.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button variant="gradient" size="lg" asChild><Link href="/"><Home className="size-4" /> Back home</Link></Button>
          <Button variant="outline" size="lg" asChild><Link href="/products"><Search className="size-4" /> Browse marketplace</Link></Button>
        </div>
      </div>
    </div>
  )
}
