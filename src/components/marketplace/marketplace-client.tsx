'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Search, SlidersHorizontal, LayoutGrid, List, X, PackageOpen, Star, ChevronDown, Cpu, DollarSign } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter, SheetClose } from '@/components/ui/sheet'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { ProductCard, ProductRow } from '@/components/marketplace/product-card'
import { CATEGORIES, LANGUAGES, LICENSES, TECHS, type Repo } from '@/lib/marketplace-config'
import {
  emptyFilters, activeFilterCount, paramsFromFilters, MAX_PRICE, type Filters,
} from '@/lib/marketplace-filters'

const SORTS = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'trending', label: 'Trending' },
  { value: 'newest', label: 'Newest' },
  { value: 'top-rated', label: 'Top rated' },
  { value: 'most-stars', label: 'Most stars' },
  { value: 'price-low', label: 'Price: low to high' },
  { value: 'price-high', label: 'Price: high to low' },
]

// Above-the-fold cards (first grid row on most breakpoints) are eager-loaded;
// everything else lazy-loads as the user scrolls.
const PRIORITY_COUNT = 3

function toggle(list: string[], value: string) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold">{title}</h4>
      {children}
    </div>
  )
}

function CheckRow({ checked, onChange, label, count }: { checked: boolean; onChange: () => void; label: string; count?: number }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 py-1 text-sm text-muted-foreground transition-colors hover:text-foreground">
      <Checkbox checked={checked} onCheckedChange={onChange} />
      <span className="flex-1">{label}</span>
      {count !== undefined && <span className="text-xs text-muted-foreground/70">{count}</span>}
    </label>
  )
}

type SetFilters = React.Dispatch<React.SetStateAction<Filters>>

function CategoryFilterGroup({ filters, set }: { filters: Filters; set: SetFilters }) {
  const [open, setOpen] = React.useState<string[]>([])

  return (
    <FilterGroup title="Category">
      <div>
        {CATEGORIES.map((c) => {
          const expanded = open.includes(c.slug)
          return (
            <div key={c.slug}>
              <div className="flex items-center gap-1">
                <CheckRow
                  label={c.name}
                  checked={filters.categories.includes(c.slug)}
                  onChange={() => set((f) => ({ ...f, categories: toggle(f.categories, c.slug) }))}
                />
                <button
                  type="button"
                  aria-label={expanded ? `Collapse ${c.name}` : `Expand ${c.name}`}
                  onClick={() => setOpen((o) => toggle(o, c.slug))}
                  className="shrink-0 rounded p-1 text-muted-foreground hover:text-foreground"
                >
                  <ChevronDown className={cn('size-3.5 transition-transform', expanded && 'rotate-180')} />
                </button>
              </div>
              {expanded && (
                <div className="ml-4 border-l border-border pl-3">
                  {c.subcategories.map((s) => (
                    <CheckRow
                      key={s.slug}
                      label={s.name}
                      checked={filters.subcategories.includes(s.slug)}
                      onChange={() => set((f) => ({ ...f, subcategories: toggle(f.subcategories, s.slug) }))}
                    />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </FilterGroup>
  )
}

/** The Technologies checklist, shared by the toolbar's quick-filter dropdown and the full filters sheet. */
function TechList({ filters, set }: { filters: Filters; set: SetFilters }) {
  return (
    <ScrollArea className="h-56 pr-3">
      {TECHS.map((t) => (
        <CheckRow
          key={t}
          label={t}
          checked={filters.techs.includes(t)}
          onChange={() => set((f) => ({ ...f, techs: toggle(f.techs, t) }))}
        />
      ))}
    </ScrollArea>
  )
}

/** The Price range slider, shared by the toolbar's quick-filter dropdown and the full filters sheet. */
function PriceControls({ filters, set }: { filters: Filters; set: SetFilters }) {
  return (
    <>
      <Slider
        value={filters.price}
        min={0}
        max={MAX_PRICE}
        step={5}
        onValueChange={(v) => set((f) => ({ ...f, price: [v[0], v[1]] as [number, number] }))}
      />
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>${filters.price[0]}</span>
        <span>${filters.price[1]}{filters.price[1] === MAX_PRICE ? '+' : ''}</span>
      </div>
      <CheckRow label="Free only" checked={filters.freeOnly} onChange={() => set((f) => ({ ...f, freeOnly: !f.freeOnly }))} />
    </>
  )
}

function FiltersPanel({ filters, set }: { filters: Filters; set: SetFilters }) {
  return (
    <div className="space-y-6">
      <CategoryFilterGroup filters={filters} set={set} />
      <Separator />
      <FilterGroup title="Price">
        <PriceControls filters={filters} set={set} />
      </FilterGroup>
      <Separator />
      <FilterGroup title="Language">
        <div>
          {LANGUAGES.map((l) => (
            <CheckRow
              key={l.name}
              label={l.name}
              checked={filters.languages.includes(l.name)}
              onChange={() => set((f) => ({ ...f, languages: toggle(f.languages, l.name) }))}
            />
          ))}
        </div>
      </FilterGroup>
      <Separator />
      <FilterGroup title="License">
        <div>
          {LICENSES.map((l) => (
            <CheckRow
              key={l}
              label={l}
              checked={filters.licenses.includes(l)}
              onChange={() => set((f) => ({ ...f, licenses: toggle(f.licenses, l) }))}
            />
          ))}
        </div>
      </FilterGroup>
      <Separator />
      <FilterGroup title="Technologies">
        <TechList filters={filters} set={set} />
      </FilterGroup>
      <Separator />
      <FilterGroup title="Minimum stars">
        <Slider value={[filters.minStars]} min={0} max={15000} step={500} onValueChange={(v) => set((f) => ({ ...f, minStars: v[0] }))} />
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Star className="size-3" /> {filters.minStars.toLocaleString()}+ stars
        </div>
      </FilterGroup>
      <Separator />
      <FilterGroup title="Seller & status">
        <CheckRow label="Verified sellers" checked={filters.verified} onChange={() => set((f) => ({ ...f, verified: !f.verified }))} />
        <CheckRow label="Featured" checked={filters.featured} onChange={() => set((f) => ({ ...f, featured: !f.featured }))} />
        <CheckRow label="Trending" checked={filters.trending} onChange={() => set((f) => ({ ...f, trending: !f.trending }))} />
      </FilterGroup>
    </div>
  )
}

/** Quick-access "Technologies" dropdown for the toolbar — the same state as the full filters panel, surfaced without opening it. */
function TechQuickFilter({ filters, set }: { filters: Filters; set: SetFilters }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="shrink-0">
          <Cpu className="size-4" /> Technologies
          {filters.techs.length > 0 && <Badge variant="brand" className="ml-1 px-1.5">{filters.techs.length}</Badge>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64 p-3">
        <TechList filters={filters} set={set} />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** Quick-access "Price" dropdown for the toolbar — same state as the full filters panel. */
function PriceQuickFilter({ filters, set }: { filters: Filters; set: SetFilters }) {
  const active = filters.price[0] > 0 || filters.price[1] < MAX_PRICE || filters.freeOnly
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="shrink-0">
          <DollarSign className="size-4" /> Price
          {active && <Badge variant="brand" className="ml-1 px-1.5">•</Badge>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64 space-y-3 p-4">
        <PriceControls filters={filters} set={set} />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function MarketplaceClient({
  products, total, totalPages, page, sort: initialSort, filters: initialFilters,
}: {
  products: Repo[]
  total: number
  totalPages: number
  page: number
  sort: string
  filters: Filters
}) {
  const router = useRouter()
  const [isPending, startTransition] = React.useTransition()

  const [filters, setFilters] = React.useState<Filters>(initialFilters)
  const [sort, setSort] = React.useState(initialSort)
  const [view, setView] = React.useState<'grid' | 'list'>('grid')
  const [qDraft, setQDraft] = React.useState(initialFilters.q)

  const activeCount = activeFilterCount(filters)

  /** Pushes a new URL for the given filters/sort/page; the server page re-fetches and this component remounts with fresh props. */
  const navigate = React.useCallback((next: Filters, nextSort: string, nextPage: number) => {
    const qs = paramsFromFilters(next, nextSort, nextPage).toString()
    startTransition(() => router.push(qs ? `/products?${qs}` : '/products'))
  }, [router])

  // Any filter/sort change resets to page 1. Debounced for the search box so
  // typing doesn't fire a request per keystroke; other controls navigate immediately.
  React.useEffect(() => {
    const t = setTimeout(() => {
      if (qDraft !== filters.q) {
        const next = { ...filters, q: qDraft }
        setFilters(next)
        navigate(next, sort, 1)
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, 400)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qDraft])

  // Note: `navigate` (a side effect) runs after computing `next`, never inside
  // the setState updater itself — React may invoke updaters outside a normal
  // event-handler context, and triggering a transition from in there corrupts
  // the render ("Cannot call startTransition while rendering").
  const updateFilters: SetFilters = (action) => {
    const next = typeof action === 'function' ? (action as (f: Filters) => Filters)(filters) : action
    setFilters(next)
    navigate(next, sort, 1)
  }

  function updateSort(nextSort: string) {
    setSort(nextSort)
    navigate(filters, nextSort, 1)
  }

  function goToPage(n: number) {
    navigate(filters, sort, n)
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function clearAll() {
    const next = emptyFilters()
    setFilters(next)
    setQDraft('')
    navigate(next, sort, 1)
  }

  return (
    <div className={cn('container py-10 transition-opacity', isPending && 'opacity-60')}>
      {/* Header */}
      <div className="mb-8 space-y-3">
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Marketplace</h1>
        <p className="text-muted-foreground">
          {total > 0
            ? `Browse ${total} production-ready projects, repos, and templates.`
            : 'Production-ready projects, repos, and templates from verified creators.'}
        </p>
      </div>

      {/* Toolbar: Search, then quick Technologies/Price filters, then sort / view / more filters.
          The site-wide Technologies and Pricing nav items (and the theme toggle) live in the
          header above — see components/layout/navbar.tsx. */}
      <div className="mb-6 flex flex-col gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={qDraft}
            onChange={(e) => setQDraft(e.target.value)}
            placeholder="Search projects, tech, or tags…"
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <TechQuickFilter filters={filters} set={updateFilters} />
          <PriceQuickFilter filters={filters} set={updateFilters} />

          <div className="ml-auto flex items-center gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="lg:hidden">
                  <SlidersHorizontal className="size-4" /> More filters
                  {activeCount > 0 && <Badge variant="brand" className="ml-1 px-1.5">{activeCount}</Badge>}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="flex h-full w-full flex-col p-0 sm:max-w-sm">
                <SheetHeader className="border-b border-border p-6 text-left"><SheetTitle>Filters</SheetTitle></SheetHeader>
                <div className="flex-1 overflow-y-auto p-6"><FiltersPanel filters={filters} set={updateFilters} /></div>
                <SheetFooter className="border-t border-border p-4">
                  <Button variant="outline" onClick={clearAll} disabled={activeCount === 0} className="sm:flex-1">
                    Clear all
                  </Button>
                  <SheetClose asChild>
                    <Button variant="gradient" className="sm:flex-1">
                      Show {total} result{total === 1 ? '' : 's'}
                    </Button>
                  </SheetClose>
                </SheetFooter>
              </SheetContent>
            </Sheet>
            <Select value={sort} onValueChange={updateSort}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {SORTS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="hidden items-center rounded-lg border border-border p-0.5 sm:flex">
              <Button variant={view === 'grid' ? 'secondary' : 'ghost'} size="icon" className="size-8" onClick={() => setView('grid')} aria-label="Grid view">
                <LayoutGrid className="size-4" />
              </Button>
              <Button variant={view === 'list' ? 'secondary' : 'ghost'} size="icon" className="size-8" onClick={() => setView('list')} aria-label="List view">
                <List className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Sidebar (desktop) — the full filter set, including Technologies and Price */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-24">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-semibold">Filters</span>
              {activeCount > 0 && (
                <button onClick={clearAll} className="text-xs text-primary hover:underline">
                  Clear all
                </button>
              )}
            </div>
            <FiltersPanel filters={filters} set={updateFilters} />
          </div>
        </aside>

        {/* Results */}
        <div className="min-w-0 flex-1">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{total}</span> results
            </p>
            {activeCount > 0 && (
              <button onClick={clearAll} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground lg:hidden">
                <X className="size-3" /> Clear
              </button>
            )}
          </div>

          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-24 text-center">
              <div className="mb-4 grid size-14 place-items-center rounded-2xl bg-muted text-muted-foreground">
                <PackageOpen className="size-7" />
              </div>
              {total === 0 && activeCount === 0 && !filters.q ? (
                <>
                  <h3 className="text-lg font-semibold">No listings yet</h3>
                  <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                    The marketplace is just getting started. Be the first to list your project.
                  </p>
                  <Button variant="gradient" className="mt-5" asChild>
                    <a href="/auth/register">Become a seller</a>
                  </Button>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-semibold">No projects match your filters</h3>
                  <p className="mt-1 max-w-sm text-sm text-muted-foreground">Try removing a filter or broadening your search to see more results.</p>
                  <Button variant="outline" className="mt-5" onClick={clearAll}>Reset filters</Button>
                </>
              )}
            </div>
          ) : view === 'grid' ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {products.map((p, i) => <ProductCard key={p.id} repo={p} priority={i < PRIORITY_COUNT} />)}
            </div>
          ) : (
            <div className="space-y-4">
              {products.map((p, i) => <ProductRow key={p.id} repo={p} priority={i < PRIORITY_COUNT} />)}
            </div>
          )}

          {/* Pagination — server-driven: page/totalPages come from the API response, not a client-side slice */}
          {totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-1.5">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => goToPage(page - 1)}>
                Previous
              </Button>
              {Array.from({ length: totalPages }).map((_, i) => {
                const n = i + 1
                if (totalPages > 7 && n !== 1 && n !== totalPages && Math.abs(n - page) > 1) {
                  if (n === 2 || n === totalPages - 1) return <span key={n} className="px-1 text-muted-foreground">…</span>
                  return null
                }
                return (
                  <Button key={n} variant={n === page ? 'default' : 'outline'} size="icon" className="size-9" onClick={() => goToPage(n)}>
                    {n}
                  </Button>
                )
              })}
              <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => goToPage(page + 1)}>
                Next
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
