'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Wallet } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'

// Note: platform-fee env var is server-only, so `feePercent` is passed in as a
// prop (read server-side) rather than computed here — the server route is the
// authoritative source for the actual fee charged either way.
export function WithdrawPanel({ available, feePercent, canWithdraw }: { available: number; feePercent: number; canWithdraw: boolean }) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [amount, setAmount] = React.useState(String(available))
  const [submitting, setSubmitting] = React.useState(false)

  const parsedAmount = Math.min(available, Math.max(0, Number(amount) || 0))
  const feeAmount = Math.round(parsedAmount * feePercent) / 100
  const netAmount = Math.round((parsedAmount - feeAmount) * 100) / 100

  const openDialog = () => {
    setAmount(String(available))
    setOpen(true)
  }

  const handleSubmit = async () => {
    if (parsedAmount <= 0) {
      toast.error('Enter a valid amount')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parsedAmount }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to request withdrawal')

      toast.success('Withdrawal requested — awaiting admin approval')
      setOpen(false)
      router.refresh()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Button variant="gradient" disabled={!canWithdraw || available <= 0} onClick={openDialog}>
        <Wallet className="size-4" /> Withdraw ${available.toLocaleString()}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request withdrawal</DialogTitle>
            <DialogDescription>Submitted for admin approval — funds are transferred once approved.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (USD)</Label>
              <Input
                id="amount"
                type="number"
                min="0"
                max={available}
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Available balance: ${available.toLocaleString()}</p>
            </div>

            <div className="space-y-1.5 rounded-lg border border-border bg-muted/40 p-4 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Total requested</span><span className="font-medium">${parsedAmount.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Platform fee</span><span className="font-medium">-${feeAmount.toFixed(2)}</span></div>
              <div className="flex justify-between border-t border-border pt-1.5 font-semibold"><span>You&apos;ll receive</span><span>${netAmount.toFixed(2)}</span></div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>Cancel</Button>
            <Button variant="gradient" onClick={handleSubmit} loading={submitting} disabled={submitting || parsedAmount <= 0}>
              Request withdrawal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
