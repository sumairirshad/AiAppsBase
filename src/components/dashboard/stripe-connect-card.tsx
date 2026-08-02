'use client'

import * as React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CreditCard, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { SellerStripeStatus } from '@/lib/dashboard'

const statusBadge: Record<string, { label: string; variant: 'success' | 'warning' | 'muted' }> = {
  not_started: { label: 'Not connected', variant: 'muted' },
  pending: { label: 'Onboarding incomplete', variant: 'warning' },
  complete: { label: 'Connected', variant: 'success' },
}

export function StripeConnectCard({ status }: { status: SellerStripeStatus }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = React.useState(false)
  const [checking, setChecking] = React.useState(false)

  React.useEffect(() => {
    if (searchParams.get('stripe_return') !== '1') return
    setChecking(true)
    fetch('/api/seller/stripe/status')
      .then((res) => res.json())
      .then((data) => {
        if (data.connected && data.onboardingStatus === 'complete') {
          toast.success('Stripe account connected')
        } else {
          toast('Onboarding not finished yet — you can pick up where you left off any time')
        }
        router.refresh()
      })
      .catch(() => toast.error('Could not verify Stripe status'))
      .finally(() => setChecking(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleConnect = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/seller/stripe/connect', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to start Stripe onboarding')
      window.location.href = data.url
    } catch (err) {
      toast.error((err as Error).message)
      setLoading(false)
    }
  }

  const badge = statusBadge[status.onboardingStatus] ?? statusBadge.not_started

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><CreditCard className="size-4" /> Payouts</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1.5">
            <Badge variant={badge.variant}>{badge.label}</Badge>
            <p className="max-w-md text-sm text-muted-foreground">
              Connect a Stripe account to receive withdrawals. Stripe collects your payout details directly — we never see or store your bank information.
            </p>
          </div>
          <Button variant={status.onboardingStatus === 'complete' ? 'outline' : 'gradient'} onClick={handleConnect} loading={loading || checking}>
            {status.onboardingStatus === 'complete' ? (
              <>Manage on Stripe <ExternalLink className="size-4" /></>
            ) : status.onboardingStatus === 'pending' ? (
              'Finish onboarding'
            ) : (
              'Connect with Stripe'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
