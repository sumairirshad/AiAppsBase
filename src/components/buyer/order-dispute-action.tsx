'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Flag } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ReasonDialog } from '@/components/dashboard/reason-dialog'

export function OrderDisputeAction({ orderId }: { orderId: string }) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)

  const submit = async (reason: string, _notes: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/orders/${orderId}/dispute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to report this order')
      toast.success('Reported — our team will review this order')
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
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <Flag className="size-4" /> Report an issue
      </Button>
      <ReasonDialog
        open={open}
        onOpenChange={setOpen}
        title="Report an issue with this order?"
        description="Tell us what's wrong — our team will review and either resolve it or issue a refund. This marks the order as disputed."
        confirmLabel="Report"
        destructive
        loading={loading}
        onConfirm={submit}
      />
    </>
  )
}
