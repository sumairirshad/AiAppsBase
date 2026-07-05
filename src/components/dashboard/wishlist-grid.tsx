'use client'

import * as React from 'react'
import Link from 'next/link'
import { Star, Trash2, ArrowUpRight } from 'lucide-react'
import { toast } from 'sonner'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/dashboard/empty-state'

type Item = { id: string; title: string; gradient: string; price: number; category: string; rating: number }

export function WishlistGrid({ items: initial }: { items: Item[] }) {
  const [items, setItems] = React.useState(initial)
  const [removing, setRemoving] = React.useState<string | null>(null)

  async function remove(productId: string) {
    setRemoving(productId)
    const prev = items
    setItems((xs) => xs.filter((x) => x.id !== productId)) // optimistic
    try {
      const res = await fetch('/api/wishlist', {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      })
      if (!res.ok) throw new Error('Failed to remove')
      toast.success('Removed from wishlist')
    } catch {
      setItems(prev) // rollback
      toast.error('Could not remove item')
    } finally {
      setRemoving(null)
    }
  }

  if (items.length === 0) {
    return <EmptyState icon="Star" title="Your wishlist is empty" description="Browse the marketplace and save the projects you love." actionLabel="Browse marketplace" actionHref="/products" />
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((p) => (
        <Card key={p.id} interactive className="group relative overflow-hidden">
          <button
            onClick={() => remove(p.id)}
            disabled={removing === p.id}
            className="absolute right-3 top-3 z-10 grid size-8 place-items-center rounded-full bg-black/40 text-white backdrop-blur-md transition-colors hover:bg-destructive"
            aria-label="Remove from wishlist"
          >
            <Trash2 className="size-4" />
          </button>
          <Link href={`/product/${p.id}`}>
            <div className={cn('relative h-28 bg-gradient-to-br', p.gradient)}>
              <div className="absolute inset-0 bg-grid bg-grid-pattern opacity-20" />
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="truncate font-semibold group-hover:text-primary">{p.title}</h3>
                <span className="shrink-0 font-display font-bold">{p.price === 0 ? 'Free' : `$${p.price}`}</span>
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1"><Star className="size-3 fill-amber-400 text-amber-400" /> {p.rating || '—'}</span>
                <span>·</span><span>{p.category}</span>
              </div>
              <div className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary">
                View project <ArrowUpRight className="size-3.5" />
              </div>
            </div>
          </Link>
        </Card>
      ))}
    </div>
  )
}
