'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Search, ArrowRight } from 'lucide-react'

import { Button } from '@/components/ui/button'

const suggestions = ['Next.js SaaS', 'AI chatbot', 'Dashboard', 'Flutter app', 'UI kit', 'Chrome extension']

export function HeroSearch() {
  const router = useRouter()
  const [q, setQ] = React.useState('')

  function submit(e: React.FormEvent) {
    e.preventDefault()
    router.push(`/products${q ? `?q=${encodeURIComponent(q)}` : ''}`)
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <form
        onSubmit={submit}
        className="group flex items-center gap-2 rounded-2xl border border-border bg-card/80 p-2 shadow-xl backdrop-blur-xl transition-colors focus-within:border-primary/50"
      >
        <Search className="ml-3 size-5 shrink-0 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search 12,000+ projects, repos, and templates…"
          className="h-11 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground sm:text-base"
          aria-label="Search the marketplace"
        />
        <Button type="submit" variant="gradient" className="hidden sm:inline-flex">
          Search <ArrowRight className="size-4" />
        </Button>
        <Button type="submit" variant="gradient" size="icon" className="sm:hidden">
          <ArrowRight className="size-4" />
        </Button>
      </form>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        <span className="text-xs text-muted-foreground">Popular:</span>
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => router.push(`/products?q=${encodeURIComponent(s)}`)}
            className="rounded-full border border-border bg-card/50 px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}
