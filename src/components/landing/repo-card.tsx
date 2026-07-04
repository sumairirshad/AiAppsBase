'use client'

import * as React from 'react'
import Link from 'next/link'
import { Star, GitFork, Bookmark, ArrowUpRight, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

import { cn, formatNumber } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { LandingRepo } from '@/lib/landing-data'

const aiToolColor: Record<string, string> = {
  Claude: 'bg-orange-500/15 text-orange-500',
  ChatGPT: 'bg-emerald-500/15 text-emerald-500',
  v0: 'bg-zinc-400/15 text-zinc-300',
  Bolt: 'bg-blue-500/15 text-blue-500',
  Cursor: 'bg-purple-500/15 text-purple-400',
  Lovable: 'bg-pink-500/15 text-pink-500',
}

export function RepoCard({ repo }: { repo: LandingRepo }) {
  const [saved, setSaved] = React.useState(false)

  return (
    <Card interactive className="group relative flex flex-col overflow-hidden">
      {/* Gradient cover */}
      <div className={cn('relative h-32 bg-gradient-to-br', repo.gradient)}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.35),transparent_55%)]" />
        <div className="absolute inset-0 bg-grid bg-grid-pattern opacity-20" />
        <div className="absolute left-4 top-4 flex gap-2">
          {repo.trending && (
            <Badge className="border-0 bg-black/30 text-white backdrop-blur-md">
              <Sparkles className="size-3" /> Trending
            </Badge>
          )}
          <Badge className="border-0 bg-black/30 text-white backdrop-blur-md">{repo.category}</Badge>
        </div>
        <button
          type="button"
          aria-label="Save to wishlist"
          onClick={() => {
            setSaved((s) => !s)
            toast.success(saved ? 'Removed from wishlist' : `Saved ${repo.name} to wishlist`)
          }}
          className="absolute right-4 top-4 grid size-8 place-items-center rounded-full bg-black/30 text-white backdrop-blur-md transition-transform hover:scale-110"
        >
          <Bookmark className={cn('size-4', saved && 'fill-current')} />
        </button>
        <div className="absolute -bottom-5 left-4 grid size-11 place-items-center rounded-xl border border-border bg-card text-lg font-bold shadow-lg">
          {repo.owner.charAt(0).toUpperCase()}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5 pt-7">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>{repo.owner}</span>
          <span>/</span>
          <span className="font-medium text-foreground">{repo.name}</span>
        </div>

        <p className="mt-2 line-clamp-2 flex-1 text-sm text-muted-foreground">{repo.description}</p>

        {/* Stats row */}
        <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <span className="size-2.5 rounded-full" style={{ backgroundColor: repo.languageColor }} />
            {repo.language}
          </span>
          <span className="inline-flex items-center gap-1">
            <Star className="size-3.5" /> {formatNumber(repo.stars)}
          </span>
          <span className="inline-flex items-center gap-1">
            <GitFork className="size-3.5" /> {formatNumber(repo.forks)}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className={cn('rounded-md px-2 py-0.5 text-[11px] font-medium', aiToolColor[repo.aiTool] ?? 'bg-muted text-muted-foreground')}>
            {repo.aiTool}
          </span>
          {repo.tags.slice(0, 2).map((t) => (
            <span key={t} className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              {t}
            </span>
          ))}
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
          <div className="flex items-center gap-1 text-sm">
            <Star className="size-4 fill-amber-400 text-amber-400" />
            <span className="font-semibold">{repo.rating}</span>
            <span className="text-xs text-muted-foreground">· {formatNumber(repo.sales)} sales</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-display text-lg font-bold">${repo.price}</span>
            <Button size="sm" asChild>
              <Link href="/products">
                View <ArrowUpRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}
