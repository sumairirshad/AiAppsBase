'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'

export function SettlementRowActions({
  id, sellerName, netAmount,
}: {
  id: string
  sellerName: string
  netAmount: number
}) {
  const router = useRouter()
  const [approveOpen, setApproveOpen] = React.useState(false)
  const [rejectOpen, setRejectOpen] = React.useState(false)
  const [reason, setReason] = React.useState('')
  const [loading, setLoading] = React.useState(false)

  const submit = async (action: 'approve' | 'reject') => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/settlements/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason: action === 'reject' ? reason : undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `Failed to ${action}`)

      toast.success(action === 'approve' ? 'Transfer sent' : 'Request rejected')
      setApproveOpen(false)
      setRejectOpen(false)
      setReason('')
      router.refresh()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button size="sm" variant="outline" onClick={() => setApproveOpen(true)}>Approve</Button>
      <Button size="sm" variant="outline" onClick={() => setRejectOpen(true)}>Reject</Button>

      <ConfirmDialog
        open={approveOpen}
        onOpenChange={setApproveOpen}
        title="Approve withdrawal?"
        description={`This will transfer $${netAmount.toFixed(2)} to ${sellerName}'s Stripe account. This cannot be undone.`}
        confirmLabel="Approve & transfer"
        loading={loading}
        onConfirm={() => submit('approve')}
      />

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject withdrawal?</DialogTitle>
            <DialogDescription>No money moves — the amount goes back into {sellerName}&apos;s available balance.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reason">Reason (shown to the seller, optional)</Label>
            <Textarea id="reason" value={reason} onChange={(e) => setReason(e.target.value)} rows={3} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)} disabled={loading}>Cancel</Button>
            <Button variant="destructive" onClick={() => submit('reject')} loading={loading} disabled={loading}>Reject</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
