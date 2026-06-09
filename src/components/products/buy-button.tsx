'use client'

import { useState } from 'react'
import { ShoppingCart, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface BuyButtonProps {
  productId: string
  licenseType: string
  label?: string
  className?: string
}

export function BuyButton({
  productId,
  licenseType,
  label = 'Buy Now',
  className = 'btn-primary w-full flex items-center justify-center gap-2',
}: BuyButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleBuy = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/checkout/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, licenseType }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Failed to start checkout')
        return
      }

      // Redirect to Stripe-hosted checkout
      window.location.href = data.url
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button onClick={handleBuy} disabled={loading} className={className}>
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <ShoppingCart className="w-4 h-4" />
      )}
      {loading ? 'Redirecting…' : label}
    </button>
  )
}
