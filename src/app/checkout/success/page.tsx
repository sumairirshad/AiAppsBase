'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, CheckCircle, Download, Loader2, XCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
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
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loader2 className="size-10 animate-spin text-primary" />
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
      <div className="flex min-h-[70vh] items-center justify-center p-4">
        <Card className="w-full max-w-md p-10 text-center">
          <Loader2 className="mx-auto mb-4 size-12 animate-spin text-primary" />
          <h2 className="mb-2 text-xl font-bold">Confirming Payment</h2>
          <p className="text-sm text-muted-foreground">Please wait while we verify your payment…</p>
        </Card>
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
      <div className="flex min-h-[70vh] items-center justify-center p-4">
        <Card className="w-full max-w-md p-10 text-center">
          <div className="mx-auto mb-6 grid size-16 place-items-center rounded-full bg-success/15">
            <CheckCircle className="size-8 text-success" />
          </div>

          <h1 className="mb-2 text-2xl font-bold">Payment Successful!</h1>
          <p className="mb-8 text-sm text-muted-foreground">
            Your purchase has been confirmed.
          </p>

          <div className="mb-8 space-y-3 rounded-xl bg-muted/50 p-5 text-left">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Product</span>
              <span className="font-medium">{data.productTitle}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">License</span>
              <span>{data.licenseType}</span>
            </div>
            <div className="mt-3 flex justify-between border-t border-border pt-3 text-sm">
              <span className="text-muted-foreground">Amount Paid</span>
              <span className="font-semibold text-success">{formatPrice(data.amount)}</span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button variant="gradient" asChild>
              <Link href="/buyer/purchases"><Download className="size-4" /> View My Purchases</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/">Continue Shopping <ArrowRight className="size-4" /></Link>
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return null
}

function ErrorCard({ message }: { message: string }) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center p-4">
      <Card className="w-full max-w-md p-10 text-center">
        <div className="mx-auto mb-6 grid size-16 place-items-center rounded-full bg-destructive/15">
          <XCircle className="size-8 text-destructive" />
        </div>
        <h2 className="mb-2 text-xl font-bold">Payment Not Confirmed</h2>
        <p className="mb-8 text-sm text-muted-foreground">{message}</p>
        <Button variant="outline" asChild>
          <Link href="/">Go Home</Link>
        </Button>
      </Card>
    </div>
  )
}
