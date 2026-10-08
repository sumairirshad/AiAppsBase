'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Star, GitFork, Bookmark, ArrowUpRight, Sparkles, BadgeCheck, Flame } from 'lucide-react'
import { toast } from 'sonner'

import { cn, formatNumber } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { productPath } from '@/lib/seo'
import { ProductImage, mediaChipClass, mediaScrimClass, mediaTextClass } from '@/components/products/product-image'
import { addToWishlist, removeFromWishlist } from '@/lib/client/wishlist'
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
  const router = useRouter()
  const [saved, setSaved] = React.useState(false)
  const [loading, setLoading] = React.useState(false)

  async function toggle(e: React.MouseEvent) {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    const result = saved ? await removeFromWishlist(repo.id) : await addToWishlist(repo.id)
    setLoading(false)

    if (result.ok) {
      setSaved((s) => !s)
      toast.success(saved ? 'Removed from wishlist' : `Saved ${repo.title} to wishlist`)
      return
    }
    if (result.reason === 'unauthorized') {
      toast.error('Please log in to save items to your wishlist.')
      router.push('/auth/login')
      return
    }
    toast.error(result.message)
  }

  return (
    <button
      type="button"
      aria-label="Save to wishlist"
      onClick={toggle}
      disabled={loading}
      className={cn('grid size-8 place-items-center rounded-full transition-transform hover:scale-110', mediaChipClass, className)}
    >
      <Bookmark className={cn('size-4', saved && 'fill-current')} />
    </button>
  )
}

export function ProductCard({ repo, priority = false }: { repo: Repo; priority?: boolean }) {
  return (
    <Card interactive className="group flex flex-col overflow-hidden">
      <Link href={productPath(repo)} className="group/media relative block h-36 overflow-hidden">
        <ProductImage src={repo.image} alt={repo.title} logoClassName="size-12 -translate-y-3" className="transition-transform duration-500 group-hover:scale-105" priority={priority} />
        <div className={cn('absolute inset-0', mediaScrimClass)} />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {repo.trending && <Badge className={cn('border-0', mediaChipClass)}><Flame className="size-3" /> Trending</Badge>}
          {repo.isNew && <Badge className={cn('border-0', mediaChipClass)}><Sparkles className="size-3" /> New</Badge>}
        </div>
        <Bookmarkable repo={repo} className="absolute right-3 top-3" />
        <span className={cn('absolute bottom-3 left-3 right-3 truncate font-display text-xl font-bold', mediaTextClass)}>{repo.title}</span>
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

export function ProductRow({ repo, priority = false }: { repo: Repo; priority?: boolean }) {
  return (
    <Card interactive className="group flex flex-col gap-4 overflow-hidden p-4 sm:flex-row">
      <Link href={productPath(repo)} className="group/media relative block h-28 shrink-0 overflow-hidden rounded-lg sm:w-56">
        <ProductImage src={repo.image} alt={repo.title} logoClassName="size-10 -translate-y-3" sizes="224px" priority={priority} />
        <div className={cn('absolute inset-0', mediaScrimClass)} />
        <span className={cn('absolute bottom-2 left-3 right-3 truncate font-display text-lg font-bold', mediaTextClass)}>{repo.title}</span>
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
