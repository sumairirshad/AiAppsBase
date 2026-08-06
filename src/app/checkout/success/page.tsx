'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, XCircle, Loader2, Download, ArrowRight } from 'lucide-react'
import { formatPrice } from '@/lib/utils'

type VerifyStatus = 'loading' | 'completed' | 'expired' | 'pending' | 'error'

interface SessionData {
  status: string
  productId: string
  productTitle: string
  amount: number
  licenseType: string
  completedAt: string
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-surface-950 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-brand-400" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}

function SuccessContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')

  const [status, setStatus] = useState<VerifyStatus>('loading')
  const [data, setData] = useState<SessionData | null>(null)

  useEffect(() => {
    if (!sessionId) {
      setStatus('error')
      return
    }

    let attempts = 0
    const maxAttempts = 6

    const verify = async () => {
      try {
        const res = await fetch(`/api/checkout/verify/${sessionId}`)
        const json = await res.json()

        if (!res.ok) {
          setStatus('error')
          return
        }

        if (json.status === 'completed') {
          setData(json)
          setStatus('completed')
          return
        }

        if (json.status === 'expired') {
          setStatus('expired')
          return
        }

        // Still pending — retry (Stripe may not have marked the session paid yet)
        attempts++
        if (attempts < maxAttempts) {
          setTimeout(verify, 2000)
        } else {
          setStatus('error')
        }
      } catch {
        setStatus('error')
      }
    }

    verify()
  }, [sessionId])

  if (!sessionId) {
    return <ErrorCard message="Invalid checkout link." />
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-surface-950 flex items-center justify-center">
        <div className="glass rounded-2xl p-12 text-center max-w-md w-full mx-4">
          <Loader2 className="w-12 h-12 text-brand-400 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Confirming Payment</h2>
          <p className="text-surface-400 text-sm">Please wait while we verify your payment…</p>
        </div>
      </div>
    )
  }

  if (status === 'expired') {
    return <ErrorCard message="This checkout session has expired. Please try purchasing again." />
  }

  if (status === 'error') {
    return <ErrorCard message="Something went wrong verifying your payment. Contact support if you were charged." />
  }

  if (status === 'completed' && data) {
    return (
      <div className="min-h-screen bg-surface-950 flex items-center justify-center p-4">
        <div className="glass rounded-2xl p-10 text-center max-w-md w-full">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-emerald-400" />
          </div>

          <h1 className="text-2xl font-bold text-white mb-2">Payment Successful!</h1>
          <p className="text-surface-400 text-sm mb-8">
            Your purchase has been confirmed.
          </p>

          <div className="bg-surface-800/60 rounded-xl p-5 text-left space-y-3 mb-8">
            <div className="flex justify-between text-sm">
              <span className="text-surface-400">Product</span>
              <span className="text-white font-medium">{data.productTitle}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-surface-400">License</span>
              <span className="text-white">{data.licenseType}</span>
            </div>
            <div className="flex justify-between text-sm border-t border-white/5 pt-3 mt-3">
              <span className="text-surface-400">Amount Paid</span>
              <span className="text-emerald-400 font-semibold">{formatPrice(data.amount)}</span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Link
              href="/buyer/purchases"
              className="btn-primary flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              View My Purchases
            </Link>
            <Link
              href="/"
              className="btn-secondary flex items-center justify-center gap-2 text-sm"
            >
              Continue Shopping
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return null
}

function ErrorCard({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center p-4">
      <div className="glass rounded-2xl p-10 text-center max-w-md w-full">
        <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Payment Not Confirmed</h2>
        <p className="text-surface-400 text-sm mb-8">{message}</p>
        <Link href="/" className="btn-secondary text-sm">
          Go Home
        </Link>
      </div>
    </div>
  )
}
