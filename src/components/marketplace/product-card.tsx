'use client'

import * as React from 'react'
import Link from 'next/link'
import { Star, GitFork, Bookmark, ArrowUpRight, Sparkles, BadgeCheck, Flame } from 'lucide-react'
import { toast } from 'sonner'

import { cn, formatNumber } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { productPath } from '@/lib/seo'
import type { Repo } from '@/lib/marketplace-config'

function Price({ repo, className }: { repo: Repo; className?: string }) {
  return (
    <div className={cn('flex items-baseline gap-1.5', className)}>
      <span className="font-display text-lg font-bold">{repo.price === 0 ? 'Free' : `$${repo.price}`}</span>
      {repo.originalPrice && (
        <span className="text-xs text-muted-foreground line-through">${repo.originalPrice}</span>
      )}
    </div>
  )
}

function Bookmarkable({ repo, className }: { repo: Repo; className?: string }) {
  const [saved, setSaved] = React.useState(false)
  return (
    <button
      type="button"
      aria-label="Save to wishlist"
      onClick={(e) => {
        e.preventDefault()
        setSaved((s) => !s)
        toast.success(saved ? 'Removed from wishlist' : `Saved ${repo.title} to wishlist`)
      }}
      className={cn('grid size-8 place-items-center rounded-full bg-black/30 text-white backdrop-blur-md transition-transform hover:scale-110', className)}
    >
      <Bookmark className={cn('size-4', saved && 'fill-current')} />
    </button>
  )
}

export function ProductCard({ repo }: { repo: Repo }) {
  return (
    <Card interactive className="group flex flex-col overflow-hidden">
      <Link href={productPath(repo)} className="relative block h-36 overflow-hidden">
        <div className={cn('absolute inset-0 bg-gradient-to-br transition-transform duration-500 group-hover:scale-105', repo.gradient)} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.35),transparent_55%)]" />
        <div className="absolute inset-0 bg-grid bg-grid-pattern opacity-20" />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {repo.trending && <Badge className="border-0 bg-black/30 text-white backdrop-blur-md"><Flame className="size-3" /> Trending</Badge>}
          {repo.isNew && <Badge className="border-0 bg-black/30 text-white backdrop-blur-md"><Sparkles className="size-3" /> New</Badge>}
        </div>
        <Bookmarkable repo={repo} className="absolute right-3 top-3" />
        <span className="absolute bottom-3 left-3 font-display text-xl font-bold text-white drop-shadow">{repo.title}</span>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>{repo.owner}</span>
          <span>/</span>
          <span className="truncate font-medium text-foreground">{repo.name}</span>
          {repo.verified && <BadgeCheck className="size-3.5 text-primary" />}
        </div>

        <p className="mt-2 line-clamp-2 flex-1 text-sm text-muted-foreground">{repo.description}</p>

        <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <span className="size-2.5 rounded-full" style={{ backgroundColor: repo.languageColor }} /> {repo.language}
          </span>
          <span className="inline-flex items-center gap-1"><Star className="size-3.5" /> {formatNumber(repo.stars)}</span>
          <span className="inline-flex items-center gap-1"><GitFork className="size-3.5" /> {formatNumber(repo.forks)}</span>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
          <div className="flex items-center gap-1 text-sm">
            <Star className="size-4 fill-amber-400 text-amber-400" />
            <span className="font-semibold">{repo.rating}</span>
            <span className="text-xs text-muted-foreground">({repo.reviewCount})</span>
          </div>
          <div className="flex items-center gap-3">
            <Price repo={repo} />
            <Button size="sm" asChild>
              <Link href={productPath(repo)}>View <ArrowUpRight className="size-4" /></Link>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}

export function ProductRow({ repo }: { repo: Repo }) {
  return (
    <Card interactive className="group flex flex-col gap-4 overflow-hidden p-4 sm:flex-row">
      <Link href={productPath(repo)} className="relative block h-28 shrink-0 overflow-hidden rounded-lg sm:w-56">
        <div className={cn('absolute inset-0 bg-gradient-to-br', repo.gradient)} />
        <div className="absolute inset-0 bg-grid bg-grid-pattern opacity-20" />
        <span className="absolute bottom-2 left-3 font-display text-lg font-bold text-white drop-shadow">{repo.title}</span>
        <Bookmarkable repo={repo} className="absolute right-2 top-2" />
      </Link>

      <div className="flex flex-1 flex-col">
        <div className="flex flex-wrap items-center gap-2">
          <Link href={productPath(repo)} className="font-semibold hover:text-primary">{repo.title}</Link>
          {repo.verified && <BadgeCheck className="size-4 text-primary" />}
          <Badge variant="muted">{repo.category}</Badge>
          {repo.trending && <Badge variant="warning"><Flame className="size-3" /> Trending</Badge>}
        </div>
        <p className="mt-1 line-clamp-2 flex-1 text-sm text-muted-foreground">{repo.description}</p>
        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1"><span className="size-2.5 rounded-full" style={{ backgroundColor: repo.languageColor }} /> {repo.language}</span>
          <span className="inline-flex items-center gap-1"><Star className="size-3.5" /> {formatNumber(repo.stars)}</span>
          <span className="inline-flex items-center gap-1"><GitFork className="size-3.5" /> {formatNumber(repo.forks)}</span>
          <span className="inline-flex items-center gap-1"><Star className="size-3.5 fill-amber-400 text-amber-400" /> {repo.rating} ({repo.reviewCount})</span>
        </div>
      </div>

      <div className="flex shrink-0 flex-row items-center justify-between gap-3 border-t border-border pt-3 sm:flex-col sm:items-end sm:justify-center sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
        <Price repo={repo} />
        <Button size="sm" asChild>
          <Link href={productPath(repo)}>View <ArrowUpRight className="size-4" /></Link>
        </Button>
      </div>
    </Card>
  )
}
