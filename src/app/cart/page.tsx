import type { Metadata } from 'next'

import { CartView } from '@/components/cart/cart-view'
import { getCart } from '@/lib/cart'
import { getSessionUserId } from '@/lib/session'

export const metadata: Metadata = { title: 'Your cart' }
export const dynamic = 'force-dynamic'

export default async function CartPage() {
  const userId = await getSessionUserId()
  const cart = userId ? await getCart(userId) : { items: [], count: 0, subtotal: 0 }

  return (
    <div className="container max-w-6xl py-10">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Your cart</h1>
        <p className="text-muted-foreground">Review your selected projects before checking out.</p>
      </div>
      <CartView items={cart.items} authed={Boolean(userId)} />
    </div>
  )
}
