'use client'

import * as React from 'react'
import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'

import { Button } from '@/components/ui/button'

export function CartLink() {
  const [count, setCount] = React.useState(0)

  const refresh = React.useCallback(() => {
    fetch('/api/cart')
      .then((r) => r.json())
      .then((d) => setCount(d.count ?? 0))
      .catch(() => setCount(0))
  }, [])

  React.useEffect(() => {
    refresh()
    window.addEventListener('cart-updated', refresh)
    return () => window.removeEventListener('cart-updated', refresh)
  }, [refresh])

  return (
    <Button variant="ghost" size="icon" asChild aria-label="Cart" className="relative">
      <Link href="/cart">
        <ShoppingCart className="size-5" />
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid size-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </Link>
    </Button>
  )
}
