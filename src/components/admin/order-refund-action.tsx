'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Undo2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ReasonDialog } from '@/components/dashboard/reason-dialog'

export function OrderRefundAction({ orderId }: { orderId: string }) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)

  const submit = async (reason: string, notes: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, notes: notes || undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to refund order')
      toast.success('Order refunded')
      setOpen(false)
      router.refresh()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button size="sm" variant="destructive" onClick={() => setOpen(true)}>
        <Undo2 className="size-4" /> Refund order
      </Button>
      <ReasonDialog
        open={open}
        onOpenChange={setOpen}
        title="Refund this order?"
        description="This issues a real Stripe refund to the buyer's original payment method and marks the order refunded. This requires a reason and will be recorded in the audit log."
        confirmLabel="Refund"
        destructive
        loading={loading}
        onConfirm={submit}
      />
    </>
  )
}
