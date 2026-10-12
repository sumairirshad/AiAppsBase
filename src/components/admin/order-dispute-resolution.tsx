'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ShieldCheck, Undo2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ReasonDialog } from '@/components/dashboard/reason-dialog'

export function OrderDisputeResolution({ orderId }: { orderId: string }) {
  const router = useRouter()
  const [pendingAction, setPendingAction] = React.useState<'uphold' | 'reject' | null>(null)
  const [loading, setLoading] = React.useState(false)

  const submit = async (reason: string, _notes: string) => {
    if (!pendingAction) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/resolve-dispute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: pendingAction, reason }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to resolve dispute')
      toast.success(pendingAction === 'uphold' ? 'Dispute upheld — order refunded' : 'Dispute rejected — order restored')
      setPendingAction(null)
      router.refresh()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" onClick={() => setPendingAction('reject')}>
          <ShieldCheck className="size-4" /> Reject dispute
        </Button>
        <Button size="sm" variant="destructive" onClick={() => setPendingAction('uphold')}>
          <Undo2 className="size-4" /> Uphold &amp; refund
        </Button>
      </div>
      <ReasonDialog
        open={pendingAction !== null}
        onOpenChange={(open) => !open && setPendingAction(null)}
        title={pendingAction === 'uphold' ? 'Uphold this dispute and refund the order?' : 'Reject this dispute?'}
        description={
          pendingAction === 'uphold'
            ? 'This issues a real Stripe refund to the buyer and marks the order refunded.'
            : 'The order goes back to completed — the buyer keeps the product and nothing is refunded.'
        }
        confirmLabel={pendingAction === 'uphold' ? 'Uphold & refund' : 'Reject dispute'}
        destructive={pendingAction === 'uphold'}
        loading={loading}
        onConfirm={submit}
      />
    </>
  )
}
