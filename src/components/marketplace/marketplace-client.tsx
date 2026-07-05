'use client'

import * as React from 'react'
import { Search, SlidersHorizontal, LayoutGrid, List, X, PackageOpen, Star } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { ProductCard, ProductRow } from '@/components/marketplace/product-card'
import { CATEGORIES, LANGUAGES, LICENSES, TECHS, type Repo } from '@/lib/marketplace-config'

const SORTS = [
  { value: 'trending', label: 'Trending' },
  { value: 'newest', label: 'Newest' },
  { value: 'top-rated', label: 'Top rated' },
  { value: 'most-stars', label: 'Most stars' },
  { value: 'price-low', label: 'Price: low to high' },
  { value: 'price-high', label: 'Price: high to low' },
]
const PER_PAGE = 12
const MAX_PRICE = 150

type Filters = {
  q: string
  categories: string[]
  languages: string[]
  licenses: string[]
  techs: string[]
  price: [number, number]
  minStars: number
  verified: boolean
  featured: boolean
  trending: boolean
  freeOnly: boolean
}

const emptyFilters = (init?: Partial<Filters>): Filters => ({
  q: '', categories: [], languages: [], licenses: [], techs: [],
  price: [0, MAX_PRICE], minStars: 0,
  verified: false, featured: false, trending: false, freeOnly: false,
  ...init,
})

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

function FiltersPanel({ filters, set, products }: { filters: Filters; set: React.Dispatch<React.SetStateAction<Filters>>; products: Repo[] }) {
  const catCount = (slug: string) => products.filter((p) => p.categorySlug === slug).length
  return (
    <div className="space-y-6">
      <FilterGroup title="Category">
        <div>
          {CATEGORIES.map((c) => (
            <CheckRow
              key={c.slug}
              label={c.name}
              count={catCount(c.slug)}
              checked={filters.categories.includes(c.slug)}
              onChange={() => set((f) => ({ ...f, categories: toggle(f.categories, c.slug) }))}
            />
          ))}
        </div>
      </FilterGroup>
      <Separator />
      <FilterGroup title="Price">
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
      <FilterGroup title="Tech stack">
        <ScrollArea className="h-40 pr-3">
          {TECHS.map((t) => (
            <CheckRow
              key={t}
              label={t}
              checked={filters.techs.includes(t)}
              onChange={() => set((f) => ({ ...f, techs: toggle(f.techs, t) }))}
            />
          ))}
        </ScrollArea>
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

export function MarketplaceClient({ products, initial }: { products: Repo[]; initial?: Partial<Filters> }) {
  const [filters, setFilters] = React.useState<Filters>(() => emptyFilters(initial))
  const [sort, setSort] = React.useState('trending')
  const [view, setView] = React.useState<'grid' | 'list'>('grid')
  const [page, setPage] = React.useState(1)

  // Reset page when filters/sort change
  React.useEffect(() => setPage(1), [filters, sort])

  const filtered = React.useMemo(() => {
    let out = products.filter((p) => {
      if (filters.q) {
        const q = filters.q.toLowerCase()
        const hay = `${p.title} ${p.name} ${p.description} ${p.techStack.join(' ')} ${p.tags.join(' ')}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      if (filters.categories.length && !filters.categories.includes(p.categorySlug)) return false
      if (filters.languages.length && !filters.languages.includes(p.language)) return false
      if (filters.licenses.length && !filters.licenses.includes(p.license)) return false
      if (filters.techs.length && !filters.techs.some((t) => p.techStack.includes(t))) return false
      if (p.price < filters.price[0] || (filters.price[1] < MAX_PRICE && p.price > filters.price[1])) return false
      if (filters.freeOnly && p.price !== 0) return false
      if (p.stars < filters.minStars) return false
      if (filters.verified && !p.verified) return false
      if (filters.featured && !p.featured) return false
      if (filters.trending && !p.trending) return false
      return true
    })
    out = [...out].sort((a, b) => {
      switch (sort) {
        case 'newest': return b.createdAt.localeCompare(a.createdAt)
        case 'top-rated': return b.rating - a.rating
        case 'most-stars': return b.stars - a.stars
        case 'price-low': return a.price - b.price
        case 'price-high': return b.price - a.price
        default: return Number(b.trending) - Number(a.trending) || b.sales - a.sales
      }
    })
    return out
  }, [filters, sort])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const pageItems = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const activeCount =
    filters.categories.length + filters.languages.length + filters.licenses.length + filters.techs.length +
    (filters.verified ? 1 : 0) + (filters.featured ? 1 : 0) + (filters.trending ? 1 : 0) + (filters.freeOnly ? 1 : 0) +
    (filters.minStars > 0 ? 1 : 0) + (filters.price[0] > 0 || filters.price[1] < MAX_PRICE ? 1 : 0)

  return (
    <div className="container py-10">
      {/* Header */}
      <div className="mb-8 space-y-3">
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Marketplace</h1>
        <p className="text-muted-foreground">
          {products.length > 0
            ? `Browse ${products.length} production-ready projects, repos, and templates.`
            : 'Production-ready projects, repos, and templates from verified creators.'}
        </p>
      </div>

      {/* Toolbar */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filters.q}
            onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
            placeholder="Search projects, tech, or tags…"
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="lg:hidden">
                <SlidersHorizontal className="size-4" /> Filters
                {activeCount > 0 && <Badge variant="brand" className="ml-1 px-1.5">{activeCount}</Badge>}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-full overflow-y-auto sm:max-w-sm">
              <SheetHeader className="text-left"><SheetTitle>Filters</SheetTitle></SheetHeader>
              <div className="p-6 pt-2"><FiltersPanel filters={filters} set={setFilters} products={products} /></div>
            </SheetContent>
          </Sheet>
          <Select value={sort} onValueChange={setSort}>
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

      <div className="flex gap-8">
        {/* Sidebar */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-24">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-semibold">Filters</span>
              {activeCount > 0 && (
                <button onClick={() => setFilters(emptyFilters())} className="text-xs text-primary hover:underline">
                  Clear all
                </button>
              )}
            </div>
            <FiltersPanel filters={filters} set={setFilters} products={products} />
          </div>
        </aside>

        {/* Results */}
        <div className="min-w-0 flex-1">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{filtered.length}</span> results
            </p>
            {activeCount > 0 && (
              <button onClick={() => setFilters(emptyFilters())} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground lg:hidden">
                <X className="size-3" /> Clear
              </button>
            )}
          </div>

          {pageItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-24 text-center">
              <div className="mb-4 grid size-14 place-items-center rounded-2xl bg-muted text-muted-foreground">
                <PackageOpen className="size-7" />
              </div>
              {products.length === 0 ? (
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
                  <Button variant="outline" className="mt-5" onClick={() => setFilters(emptyFilters())}>Reset filters</Button>
                </>
              )}
            </div>
          ) : view === 'grid' ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {pageItems.map((p) => <ProductCard key={p.id} repo={p} />)}
            </div>
          ) : (
            <div className="space-y-4">
              {pageItems.map((p) => <ProductRow key={p.id} repo={p} />)}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-1.5">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                Previous
              </Button>
              {Array.from({ length: totalPages }).map((_, i) => {
                const n = i + 1
                if (totalPages > 7 && n !== 1 && n !== totalPages && Math.abs(n - page) > 1) {
                  if (n === 2 || n === totalPages - 1) return <span key={n} className="px-1 text-muted-foreground">…</span>
                  return null
                }
                return (
                  <Button key={n} variant={n === page ? 'default' : 'outline'} size="icon" className="size-9" onClick={() => setPage(n)}>
                    {n}
                  </Button>
                )
              })}
              <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                Next
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
