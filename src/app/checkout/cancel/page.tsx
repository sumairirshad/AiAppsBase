'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { XCircle, ArrowLeft, ShoppingCart, Loader2 } from 'lucide-react'

export default function CheckoutCancelPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-surface-950 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-brand-400" />
      </div>
    }>
      <CancelContent />
    </Suspense>
  )
}

function CancelContent() {
  const searchParams = useSearchParams()
  const productId = searchParams.get('product_id')

  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center p-4">
      <div className="glass rounded-2xl p-10 text-center max-w-md w-full">
        <div className="w-16 h-16 rounded-full bg-surface-800 flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-8 h-8 text-surface-400" />
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">Payment Cancelled</h1>
        <p className="text-surface-400 text-sm mb-8">
          Your payment was cancelled. You have not been charged.
        </p>

        <div className="flex flex-col gap-3">
          {productId && (
            <Link
              href={`/product/${productId}`}
              className="btn-primary flex items-center justify-center gap-2"
            >
              <ShoppingCart className="w-4 h-4" />
              Back to Product
            </Link>
          )}
          <Link
            href="/"
            className="btn-secondary flex items-center justify-center gap-2 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Continue Browsing
          </Link>
        </div>
      </div>
    </div>
  )
}
