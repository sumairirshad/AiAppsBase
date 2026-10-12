'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Search, Loader2, ArrowRight } from 'lucide-react'

import { cn } from '@/lib/utils'
import { productPath } from '@/lib/seo'

type Result = { id: string; title: string; category: string; price: number; language: string }

export function HeaderSearch({ className }: { className?: string }) {
  const router = useRouter()
  const inputRef = React.useRef<HTMLInputElement>(null)
  const wrapRef = React.useRef<HTMLDivElement>(null)
  const listId = React.useId()

  const [q, setQ] = React.useState('')
  const [results, setResults] = React.useState<Result[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState(false)
  const [open, setOpen] = React.useState(false)
  // -1 = the "see all results" row is not highlighted; 0..n-1 = a product row
  const [active, setActive] = React.useState(-1)

  const trimmed = q.trim()

  // Debounced live results; aborts in-flight requests when the query changes.
  React.useEffect(() => {
    if (!trimmed) {
      setResults([]); setLoading(false); setError(false)
      return
    }
    const ctrl = new AbortController()
    setLoading(true)
    const t = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, { signal: ctrl.signal })
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error('search failed'))))
        .then((d) => { setResults(d.results ?? []); setError(false); setActive(-1) })
        .catch((err) => { if (err.name !== 'AbortError') { setResults([]); setError(true) } })
        .finally(() => { if (!ctrl.signal.aborted) setLoading(false) })
    }, 200)
    return () => { clearTimeout(t); ctrl.abort() }
  }, [trimmed])

  // ⌘K / Ctrl+K focuses the search box.
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        inputRef.current?.select()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Close when clicking outside.
  React.useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  function go(href: string) {
    setOpen(false)
    inputRef.current?.blur()
    router.push(href)
  }

  function seeAll() {
    go(trimmed ? `/products?q=${encodeURIComponent(trimmed)}` : '/products')
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (active >= 0 && results[active]) go(productPath(results[active]))
    else seeAll()
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') { setOpen(false); inputRef.current?.blur(); return }
    if (!results.length) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setActive((i) => (i + 1 >= results.length ? -1 : i + 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setOpen(true); setActive((i) => (i <= -1 ? results.length - 1 : i - 1)) }
  }

  const showPanel = open && trimmed.length > 0

  return (
    <div ref={wrapRef} className={cn('relative', className)}>
      <form onSubmit={onSubmit} role="search">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          ref={inputRef}
          type="search"
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search projects, tech, or tags…"
          aria-label="Search the marketplace"
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
          className="h-9 w-full rounded-lg border border-border bg-muted/40 pl-9 pr-16 text-base outline-none transition-colors placeholder:text-muted-foreground hover:bg-muted focus:border-primary/50 focus:bg-background sm:text-sm [&::-webkit-search-cancel-button]:hidden"
        />
        <span className="pointer-events-none absolute right-2.5 top-1/2 flex -translate-y-1/2 items-center gap-1.5">
          {loading && <Loader2 className="size-3.5 animate-spin text-muted-foreground" />}
          <kbd className="hidden rounded border border-border bg-background px-1.5 text-[10px] font-medium text-muted-foreground lg:inline">⌘K</kbd>
        </span>
      </form>

      {showPanel && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-2xl">
          <ul id={listId} role="listbox" aria-label="Search results" className="max-h-[60vh] overflow-y-auto p-1.5">
            {results.map((r, i) => (
              <li key={r.id} id={`${listId}-${i}`} role="option" aria-selected={active === i}>
                <button
                  type="button"
                  onMouseEnter={() => setActive(i)}
                  onClick={() => go(productPath(r))}
                  className={cn('flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm', active === i ? 'bg-accent' : 'hover:bg-accent')}
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{r.title}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {r.category}{r.language ? ` · ${r.language}` : ''}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs font-semibold">{r.price === 0 ? 'Free' : `$${r.price}`}</span>
                </button>
              </li>
            ))}
            {!loading && !error && results.length === 0 && (
              <li className="px-3 py-6 text-center text-sm text-muted-foreground">No products match &ldquo;{trimmed}&rdquo;</li>
            )}
            {error && (
              <li className="px-3 py-6 text-center text-sm text-muted-foreground">Search is unavailable right now. Press Enter to search the marketplace.</li>
            )}
          </ul>
          <button
            type="button"
            onClick={seeAll}
            className="flex w-full items-center justify-between border-t border-border px-4 py-2.5 text-sm text-primary hover:bg-accent"
          >
            <span>See all results for &ldquo;{trimmed}&rdquo;</span>
            <ArrowRight className="size-4" />
          </button>
        </div>
      )}
    </div>
  )
}
