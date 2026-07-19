'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Trash2, ShoppingCart, ArrowRight, ShieldCheck, Loader2, BadgeCheck } from 'lucide-react'
import { toast } from 'sonner'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { EmptyState } from '@/components/dashboard/empty-state'
import { claimFreeProduct } from '@/lib/client/claim-free-product'
import type { CartItem } from '@/lib/cart'

function notifyCartChanged() {
  window.dispatchEvent(new Event('cart-updated'))
}

export function CartView({ items: initial, authed }: { items: CartItem[]; authed: boolean }) {
  const router = useRouter()
  const [items, setItems] = React.useState(initial)
  const [busy, setBusy] = React.useState<string | null>(null)

  const subtotal = items.reduce((a, b) => a + b.price, 0)
  const fee = 0
  const total = subtotal + fee

  async function remove(productId: string) {
    const prev = items
    setItems((xs) => xs.filter((x) => x.productId !== productId))
    try {
      const res = await fetch('/api/cart', {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      })
      if (!res.ok) throw new Error()
      toast.success('Removed from cart')
      notifyCartChanged()
    } catch {
      setItems(prev)
      toast.error('Could not remove item')
    }
  }

  async function checkout(item: CartItem) {
    if (item.price === 0) {
      setBusy(item.productId)
      const result = await claimFreeProduct(item.productId, item.license)
      setBusy(null)

      if (result.ok || result.reason === 'already-owned') {
        setItems((xs) => xs.filter((x) => x.productId !== item.productId))
        toast.success(result.ok ? `${item.title} is yours — redirecting to your downloads` : 'You already own this product')
        router.push('/buyer/downloads')
        return
      }
      if (result.reason === 'unauthorized') {
        toast.error('Please sign in to get this product')
        router.push('/auth/login')
        return
      }
      toast.error(result.message)
      return
    }
    setBusy(item.productId)
    try {
      const res = await fetch('/api/checkout/create-session', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: item.productId, licenseType: item.license }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to start checkout')
      window.location.href = data.url
    } catch (err) {
      toast.error((err as Error).message)
      setBusy(null)
    }
  }

  if (!authed) {
    return <EmptyState icon="ShoppingBag" title="Sign in to view your cart" description="Your cart is saved to your account. Sign in to see your items." actionLabel="Sign in" actionHref="/auth/login" />
  }

  if (items.length === 0) {
    return <EmptyState icon="ShoppingBag" title="Your cart is empty" description="Browse the marketplace and add projects you want to buy." actionLabel="Browse marketplace" actionHref="/products" />
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
      {/* Items */}
      <div className="space-y-4">
        {items.map((item) => (
          <Card key={item.id}>
            <CardContent className="flex items-center gap-4 p-4">
              <Link href={`/product/${item.productId}`} className={cn('size-16 shrink-0 rounded-lg bg-gradient-to-br', item.gradient)} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Link href={`/product/${item.productId}`} className="truncate font-semibold hover:text-primary">{item.title}</Link>
                  {item.ownedAlready && <Badge variant="success"><BadgeCheck className="size-3" /> Owned</Badge>}
                </div>
                <p className="text-xs text-muted-foreground">{item.owner} · {item.category} · {item.license} license</p>
                <button onClick={() => remove(item.productId)} className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-destructive">
                  <Trash2 className="size-3.5" /> Remove
                </button>
              </div>
              <div className="text-right">
                <div className="font-display text-lg font-bold">{item.price === 0 ? 'Free' : `$${item.price}`}</div>
                <Button size="sm" className="mt-2" disabled={item.ownedAlready || busy === item.productId} onClick={() => checkout(item)}>
                  {busy === item.productId ? <Loader2 className="size-4 animate-spin" /> : null}
                  {item.ownedAlready ? 'Owned' : item.price === 0 ? 'Get free' : 'Checkout'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary */}
      <div className="lg:sticky lg:top-24 lg:self-start">
        <Card className="p-6">
          <h2 className="text-lg font-semibold">Order summary</h2>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal ({items.length} item{items.length === 1 ? '' : 's'})</span><span className="font-medium">${subtotal}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Fees</span><span className="font-medium">${fee}</span></div>
          </div>
          <Separator className="my-4" />
          <div className="flex justify-between text-base font-semibold"><span>Total</span><span>${total}</span></div>

          <div className="mt-5 flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-xs text-success">
            <ShieldCheck className="size-4 shrink-0" /> Secure checkout · 14-day buyer protection
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            Each project is delivered instantly after payment. Digital licenses are purchased per project via secure Stripe checkout.
          </p>

          <Button className="mt-4 w-full" variant="outline" asChild>
            <Link href="/products"><ShoppingCart className="size-4" /> Continue shopping <ArrowRight className="size-4" /></Link>
          </Button>
        </Card>
      </div>
    </div>
  )
}
