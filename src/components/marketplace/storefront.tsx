'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  Star, BadgeCheck, MapPin, Link2, CalendarDays, Package, Download, Share2,
  Search, LayoutGrid, List, Clock, ChevronRight, MessageSquare,
} from 'lucide-react'
import { toast } from 'sonner'

import { cn, formatNumber } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { ProductCard, ProductRow } from '@/components/marketplace/product-card'
import { productPath } from '@/lib/seo'
import type { Storefront } from '@/lib/products'

type Sort = 'popular' | 'newest' | 'rating' | 'price-asc' | 'price-desc'

function sortProducts<T extends { sales: number; createdAt: string; rating: number; price: number }>(list: T[], sort: Sort): T[] {
  const out = [...list]
  switch (sort) {
    case 'newest': return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    case 'rating': return out.sort((a, b) => b.rating - a.rating)
    case 'price-asc': return out.sort((a, b) => a.price - b.price)
    case 'price-desc': return out.sort((a, b) => b.price - a.price)
    default: return out // server order: featured, best-selling, newest
  }
}

function websiteLabel(url: string) {
  try { return new URL(url).host.replace(/^www\./, '') } catch { return url }
}

function Stars({ value, className }: { value: number; className?: string }) {
  return (
    <span className="flex">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={cn('size-3.5', className, i < Math.round(value) ? 'fill-amber-400 text-amber-400' : 'text-muted')} />
      ))}
    </span>
  )
}

export function StorefrontView({ data }: { data: Storefront }) {
  const { seller, products, reviews, ratingDist, categories } = data
  const [q, setQ] = React.useState('')
  const [category, setCategory] = React.useState('all')
  const [sort, setSort] = React.useState<Sort>('popular')
  const [view, setView] = React.useState<'grid' | 'list'>('grid')

  const visible = React.useMemo(() => {
    const needle = q.trim().toLowerCase()
    const filtered = products.filter((p) =>
      (category === 'all' || p.category === category) &&
      (!needle || p.title.toLowerCase().includes(needle) || p.description.toLowerCase().includes(needle) ||
        p.techStack.some((t) => t.toLowerCase().includes(needle)))
    )
    return sortProducts(filtered, sort)
  }, [products, q, category, sort])

  function share() {
    navigator.clipboard?.writeText(window.location.href)
    toast.success('Storefront link copied')
  }

  return (
    <div>
      {/* Banner */}
      <div className={cn('relative h-44 overflow-hidden bg-gradient-to-br sm:h-56', seller.gradient)}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.35),transparent_55%)]" />
        <div className="absolute inset-0 bg-grid bg-grid-pattern opacity-20" />
      </div>

      <div className="container">
        {/* Header */}
        <div className="relative -mt-14 flex flex-col gap-5 sm:-mt-16 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <Avatar className="size-28 border-4 border-background shadow-lg sm:size-32">
              {seller.avatar && <AvatarImage src={seller.avatar} alt={seller.name} />}
              <AvatarFallback className="text-3xl">{seller.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-3xl font-bold tracking-tight">{seller.name}</h1>
                {seller.verified && <BadgeCheck className="size-6 text-primary" aria-label="Verified seller" />}
                {seller.badge !== 'Seller' && <Badge variant="brand">{seller.badge}</Badge>}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span>@{seller.handle}</span>
                {seller.location && <span className="flex items-center gap-1"><MapPin className="size-3.5" /> {seller.location}</span>}
                {seller.joinedAt && (
                  <span className="flex items-center gap-1">
                    <CalendarDays className="size-3.5" /> Member since {new Date(seller.joinedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </span>
                )}
                {seller.website && (
                  <a href={seller.website} target="_blank" rel="noopener noreferrer nofollow" className="flex items-center gap-1 hover:text-foreground">
                    <Link2 className="size-3.5" /> {websiteLabel(seller.website)}
                  </a>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2 pb-1">
            <Button variant="outline" onClick={share}><Share2 className="size-4" /> Share</Button>
          </div>
        </div>

        {seller.bio && <p className="mt-6 max-w-3xl whitespace-pre-line leading-relaxed text-muted-foreground">{seller.bio}</p>}

        {/* Stats */}
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { icon: Package, label: 'Products', value: String(seller.productCount) },
            { icon: Download, label: 'Sales', value: formatNumber(seller.sales) },
            { icon: Star, label: 'Avg. rating', value: seller.reviewCount ? String(seller.rating) : '—' },
            { icon: MessageSquare, label: 'Reviews', value: formatNumber(seller.reviewCount) },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-card p-4">
              <s.icon className="mb-2 size-4 text-muted-foreground" />
              <div className="font-display text-2xl font-bold">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Products */}
        <section className="mt-12">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-display text-2xl font-bold tracking-tight">
              Products <span className="text-base font-normal text-muted-foreground">({products.length})</span>
            </h2>
            {products.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-full sm:w-56">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search this store" className="pl-9" aria-label="Search this store" />
                </div>
                {categories.length > 1 && (
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="w-44" aria-label="Category"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All categories</SelectItem>
                      {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
                <Select value={sort} onValueChange={(v) => setSort(v as Sort)}>
                  <SelectTrigger className="w-40" aria-label="Sort"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="popular">Most popular</SelectItem>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="rating">Top rated</SelectItem>
                    <SelectItem value="price-asc">Price: low to high</SelectItem>
                    <SelectItem value="price-desc">Price: high to low</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex rounded-md border border-border">
                  <button type="button" aria-label="Grid view" onClick={() => setView('grid')} className={cn('grid size-9 place-items-center', view === 'grid' ? 'bg-muted text-foreground' : 'text-muted-foreground')}><LayoutGrid className="size-4" /></button>
                  <button type="button" aria-label="List view" onClick={() => setView('list')} className={cn('grid size-9 place-items-center', view === 'list' ? 'bg-muted text-foreground' : 'text-muted-foreground')}><List className="size-4" /></button>
                </div>
              </div>
            )}
          </div>

          {products.length === 0 ? (
            <Card className="mt-6 p-10 text-center text-muted-foreground">
              {seller.name} hasn&apos;t published any products yet.
            </Card>
          ) : visible.length === 0 ? (
            <Card className="mt-6 p-10 text-center text-muted-foreground">
              No products match your filters.{' '}
              <button type="button" className="text-primary hover:underline" onClick={() => { setQ(''); setCategory('all') }}>Clear filters</button>
            </Card>
          ) : view === 'grid' ? (
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((r) => <ProductCard key={r.id} repo={r} />)}
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {visible.map((r) => <ProductRow key={r.id} repo={r} />)}
            </div>
          )}
        </section>

        {/* Reviews */}
        {seller.reviewCount > 0 && (
          <section className="mt-16 pb-16">
            <h2 className="mb-6 font-display text-2xl font-bold tracking-tight">What buyers say</h2>
            <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
              <Card className="h-fit p-6 text-center">
                <div className="font-display text-5xl font-bold">{seller.rating}</div>
                <div className="mt-1 flex justify-center"><Stars value={seller.rating} className="size-4" /></div>
                <div className="mt-1 text-xs text-muted-foreground">{seller.reviewCount} reviews across all products</div>
                <div className="mt-5 space-y-1.5">
                  {ratingDist.map((r) => (
                    <div key={r.stars} className="flex items-center gap-2 text-xs">
                      <span className="flex w-8 items-center gap-0.5 text-muted-foreground">{r.stars}<Star className="size-3" /></span>
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-amber-400" style={{ width: `${r.pct}%` }} />
                      </div>
                      <span className="w-8 text-right text-muted-foreground">{r.pct}%</span>
                    </div>
                  ))}
                </div>
              </Card>
              <div className="grid gap-4 sm:grid-cols-2">
                {reviews.map((rev) => (
                  <Card key={rev.id} className="flex flex-col p-5">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-9"><AvatarFallback>{rev.author.charAt(0)}</AvatarFallback></Avatar>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          {rev.author}
                          {rev.verified && <Badge variant="success" className="px-1.5 py-0 text-[10px]"><BadgeCheck className="size-3" /> Verified</Badge>}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Stars value={rev.rating} className="size-3" />
                          <span className="flex items-center gap-1"><Clock className="size-3" /> {rev.date}</span>
                        </div>
                      </div>
                    </div>
                    <p className="mt-3 flex-1 text-sm text-muted-foreground">{rev.body}</p>
                    <Link href={productPath({ id: rev.productId, title: rev.productTitle })} className="mt-3 inline-flex items-center gap-1 text-xs text-primary hover:underline">
                      {rev.productTitle} <ChevronRight className="size-3" />
                    </Link>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}
        {seller.reviewCount === 0 && <div className="pb-16" />}
      </div>
    </div>
  )
}
