'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  Star, GitFork, Eye, GitCommitHorizontal, CircleDot, Users, BadgeCheck,
  Check, Share2, Heart, ShieldCheck, Download, ExternalLink, Github, ChevronRight,
  Sparkles, Flame, Clock, ThumbsUp,
} from 'lucide-react'
import { toast } from 'sonner'

import { cn, formatNumber } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { ProductCard } from '@/components/marketplace/product-card'
import type { Repo, Seller } from '@/lib/marketplace-config'

function StatTile({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3 text-center">
      <Icon className="mx-auto mb-1 size-4 text-muted-foreground" />
      <div className="font-display text-lg font-bold">{value}</div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
    </div>
  )
}

function Gallery({ repo }: { repo: Repo }) {
  const panels = [repo.gradient, 'from-slate-700 to-slate-900', repo.gradient, 'from-zinc-700 to-zinc-900']
  const [active, setActive] = React.useState(0)
  return (
    <div className="space-y-3">
      <div className={cn('relative aspect-[16/9] overflow-hidden rounded-2xl bg-gradient-to-br', panels[active])}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.3),transparent_55%)]" />
        <div className="absolute inset-0 bg-grid bg-grid-pattern opacity-20" />
        <div className="absolute bottom-6 left-6">
          <div className="font-display text-3xl font-bold text-white drop-shadow">{repo.title}</div>
          <div className="mt-1 font-mono text-sm text-white/80">{repo.owner}/{repo.name}</div>
        </div>
        <Badge className="absolute right-4 top-4 border-0 bg-black/30 text-white backdrop-blur-md">Preview {active + 1}/{panels.length}</Badge>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {panels.map((g, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={cn('relative aspect-[16/9] overflow-hidden rounded-lg bg-gradient-to-br transition-all', g, active === i ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : 'opacity-70 hover:opacity-100')}
          >
            <div className="absolute inset-0 bg-grid bg-grid-pattern opacity-20" />
          </button>
        ))}
      </div>
    </div>
  )
}

function RatingBar({ stars, pct }: { stars: number; pct: number }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="flex w-8 items-center gap-0.5 text-muted-foreground">{stars}<Star className="size-3" /></span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-amber-400" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-8 text-right text-muted-foreground">{pct}%</span>
    </div>
  )
}

function PurchasePanel({ repo }: { repo: Repo }) {
  const [saved, setSaved] = React.useState(false)
  const [license, setLicense] = React.useState('commercial')
  const licenseMultiplier: Record<string, number> = { personal: 1, commercial: 1, extended: 2.5 }
  const displayPrice = repo.price === 0 ? 0 : Math.round(repo.price * (licenseMultiplier[license] ?? 1))

  return (
    <Card className="p-5">
      <div className="flex items-baseline gap-2">
        <span className="font-display text-3xl font-bold">{displayPrice === 0 ? 'Free' : `$${displayPrice}`}</span>
        {repo.originalPrice && license === 'commercial' && (
          <>
            <span className="text-muted-foreground line-through">${repo.originalPrice}</span>
            <Badge variant="success">Save {Math.round((1 - repo.price / repo.originalPrice) * 100)}%</Badge>
          </>
        )}
      </div>

      {repo.price > 0 && (
        <div className="mt-4 space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">License</label>
          <Select value={license} onValueChange={setLicense}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="personal">Personal — 1 project</SelectItem>
              <SelectItem value="commercial">Commercial — unlimited client work</SelectItem>
              <SelectItem value="extended">Extended — resale rights</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="mt-4 space-y-2">
        <Button
          variant="gradient"
          size="lg"
          className="w-full"
          onClick={() => toast.success('Added to cart', { description: `${repo.title} — ${displayPrice === 0 ? 'Free' : `$${displayPrice}`}` })}
        >
          {repo.price === 0 ? <><Download className="size-4" /> Get it free</> : <><Sparkles className="size-4" /> Buy now</>}
        </Button>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={() => { setSaved((s) => !s); toast.success(saved ? 'Removed' : 'Saved to wishlist') }}>
            <Heart className={cn('size-4', saved && 'fill-current text-rose-500')} /> {saved ? 'Saved' : 'Wishlist'}
          </Button>
          <Button
            variant="outline"
            onClick={() => { navigator.clipboard?.writeText(window.location.href); toast.success('Link copied') }}
          >
            <Share2 className="size-4" /> Share
          </Button>
        </div>
      </div>

      <Separator className="my-5" />

      <ul className="space-y-2.5 text-sm">
        {[
          'Full source code via GitHub',
          'Instant access after purchase',
          'Free lifetime updates',
          '14-day buyer protection',
          'Commercial license included',
        ].map((t) => (
          <li key={t} className="flex items-center gap-2 text-muted-foreground">
            <Check className="size-4 shrink-0 text-success" /> {t}
          </li>
        ))}
      </ul>

      <div className="mt-5 flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-xs text-success">
        <ShieldCheck className="size-4 shrink-0" /> Secure checkout · Scanned & verified
      </div>
    </Card>
  )
}

export function ProductDetail({ repo, seller, related }: { repo: Repo; seller?: Seller; related: Repo[] }) {
  const ratingDist = [
    { stars: 5, pct: 72 }, { stars: 4, pct: 18 }, { stars: 3, pct: 6 }, { stars: 2, pct: 3 }, { stars: 1, pct: 1 },
  ]

  return (
    <div className="container py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <ChevronRight className="size-3.5" />
        <Link href="/products" className="hover:text-foreground">Marketplace</Link>
        <ChevronRight className="size-3.5" />
        <Link href={`/products?category=${repo.categorySlug}`} className="hover:text-foreground">{repo.category}</Link>
        <ChevronRight className="size-3.5" />
        <span className="truncate text-foreground">{repo.title}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[1.7fr_1fr]">
        {/* Main */}
        <div className="min-w-0 space-y-8">
          <Gallery repo={repo} />

          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="brand">{repo.category}</Badge>
              {repo.trending && <Badge variant="warning"><Flame className="size-3" /> Trending</Badge>}
              {repo.isNew && <Badge variant="success"><Sparkles className="size-3" /> New</Badge>}
              <Badge variant="muted">{repo.license} license</Badge>
            </div>

            <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{repo.title}</h1>

            <div className="flex flex-wrap items-center gap-4 text-sm">
              <span className="font-mono text-muted-foreground">{repo.owner}/{repo.name}</span>
              <span className="flex items-center gap-1">
                <Star className="size-4 fill-amber-400 text-amber-400" />
                <span className="font-semibold">{repo.rating}</span>
                <span className="text-muted-foreground">({repo.reviewCount} reviews)</span>
              </span>
              <span className="flex items-center gap-1 text-muted-foreground"><Download className="size-4" /> {formatNumber(repo.sales)} sales</span>
            </div>

            <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
              <StatTile icon={Star} label="Stars" value={formatNumber(repo.stars)} />
              <StatTile icon={GitFork} label="Forks" value={formatNumber(repo.forks)} />
              <StatTile icon={Eye} label="Watchers" value={formatNumber(repo.watchers)} />
              <StatTile icon={GitCommitHorizontal} label="Commits" value={formatNumber(repo.commits)} />
              <StatTile icon={CircleDot} label="Issues" value={String(repo.issues)} />
              <StatTile icon={Users} label="Contributors" value={String(repo.contributors)} />
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="overview">
            <TabsList className="w-full justify-start overflow-x-auto">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="features">Features</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
              <TabsTrigger value="changelog">Changelog</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <p className="leading-relaxed text-muted-foreground">{repo.longDescription}</p>
              <div>
                <h3 className="mb-3 font-semibold">Tech stack</h3>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary"><span className="mr-1 size-2 rounded-full" style={{ backgroundColor: repo.languageColor }} />{repo.language}</Badge>
                  {repo.techStack.map((t) => <Badge key={t} variant="secondary">{t}</Badge>)}
                  <Badge variant="brand"><Sparkles className="size-3" /> Built with {repo.aiTool}</Badge>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" asChild><a href={repo.demoUrl} target="_blank" rel="noreferrer"><ExternalLink className="size-4" /> Live demo</a></Button>
                <Button variant="outline" asChild><a href={repo.repoUrl} target="_blank" rel="noreferrer"><Github className="size-4" /> Repository</a></Button>
              </div>
            </TabsContent>

            <TabsContent value="features">
              <ul className="grid gap-3 sm:grid-cols-2">
                {repo.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 rounded-lg border border-border bg-card p-3 text-sm">
                    <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-success/15 text-success"><Check className="size-3.5" /></span>
                    <span className="text-muted-foreground">{f}</span>
                  </li>
                ))}
              </ul>
            </TabsContent>

            <TabsContent value="reviews" className="space-y-6">
              <div className="grid gap-6 rounded-2xl border border-border bg-card p-6 sm:grid-cols-[auto_1fr]">
                <div className="text-center">
                  <div className="font-display text-5xl font-bold">{repo.rating}</div>
                  <div className="mt-1 flex justify-center">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={cn('size-4', i < Math.round(repo.rating) ? 'fill-amber-400 text-amber-400' : 'text-muted')} />
                    ))}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">{repo.reviewCount} reviews</div>
                </div>
                <div className="space-y-1.5">
                  {ratingDist.map((r) => <RatingBar key={r.stars} {...r} />)}
                </div>
              </div>
              <div className="space-y-4">
                {repo.reviews.map((rev) => (
                  <Card key={rev.id} className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-10"><AvatarImage src={rev.avatar} alt={rev.author} /><AvatarFallback>{rev.author.charAt(0)}</AvatarFallback></Avatar>
                        <div>
                          <div className="flex items-center gap-2 text-sm font-medium">
                            {rev.author}
                            {rev.verified && <Badge variant="success" className="px-1.5 py-0 text-[10px]"><BadgeCheck className="size-3" /> Verified</Badge>}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="flex">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={cn('size-3', i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-muted')} />)}</span>
                            <span className="flex items-center gap-1"><Clock className="size-3" /> {rev.date}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <h4 className="mt-3 text-sm font-semibold">{rev.title}</h4>
                    <p className="mt-1 text-sm text-muted-foreground">{rev.body}</p>
                    <button className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"><ThumbsUp className="size-3.5" /> Helpful ({rev.helpful})</button>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="changelog" className="space-y-4">
              {repo.changelog.map((c, i) => (
                <div key={c.version} className="relative pl-6">
                  <div className="absolute left-0 top-1.5 size-2.5 rounded-full bg-primary" />
                  {i < repo.changelog.length - 1 && <div className="absolute left-[4.5px] top-4 h-full w-px bg-border" />}
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold">v{c.version}</span>
                    {i === 0 && <Badge variant="success">Latest</Badge>}
                    <span className="text-xs text-muted-foreground">{c.date}</span>
                  </div>
                  <ul className="mt-2 space-y-1 pb-4">
                    {c.notes.map((n) => <li key={n} className="text-sm text-muted-foreground">• {n}</li>)}
                  </ul>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <PurchasePanel repo={repo} />

          {seller && (
            <Card className="p-5">
              <h3 className="mb-4 text-sm font-semibold">About the seller</h3>
              <div className="flex items-center gap-3">
                <Avatar className="size-12 ring-2 ring-primary/20">
                  <AvatarImage src={seller.avatar} alt={seller.name} />
                  <AvatarFallback>{seller.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 font-medium">
                    {seller.name}
                    {seller.verified && <BadgeCheck className="size-4 text-primary" />}
                  </div>
                  <div className="text-xs text-muted-foreground">@{seller.handle}</div>
                </div>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{seller.bio}</p>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
                <div><div className="font-semibold">{seller.rating}</div><div className="text-xs text-muted-foreground">rating</div></div>
                <div><div className="font-semibold">{formatNumber(seller.sales)}</div><div className="text-xs text-muted-foreground">sales</div></div>
                <div><div className="font-semibold">{seller.productCount}</div><div className="text-xs text-muted-foreground">products</div></div>
              </div>
              <Button variant="outline" className="mt-4 w-full" onClick={() => toast('Seller storefronts are coming soon')}>View storefront</Button>
            </Card>
          )}
        </div>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <div className="mt-16">
          <h2 className="mb-6 font-display text-2xl font-bold tracking-tight">Related projects</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((r) => <ProductCard key={r.id} repo={r} />)}
          </div>
        </div>
      )}
    </div>
  )
}
