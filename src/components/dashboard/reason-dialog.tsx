'use client'

import * as React from 'react'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'

/**
 * Confirmation dialog for admin actions that must carry a mandatory reason
 * (and optional free-form notes) for the audit log — block/suspend/ban/etc.
 */
export function ReasonDialog({
  open, onOpenChange, title, description, confirmLabel = 'Confirm',
  cancelLabel = 'Cancel', destructive, loading, onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  loading?: boolean
  onConfirm: (reason: string, notes: string) => void
}) {
  const [reason, setReason] = React.useState('')
  const [notes, setNotes] = React.useState('')
  const [touched, setTouched] = React.useState(false)

  React.useEffect(() => {
    if (open) { setReason(''); setNotes(''); setTouched(false) }
  }, [open])

  const reasonMissing = touched && reason.trim().length === 0

  const submit = () => {
    if (!reason.trim()) { setTouched(true); return }
    onConfirm(reason.trim(), notes.trim())
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reason-dialog-reason">
              Reason <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="reason-dialog-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              onBlur={() => setTouched(true)}
              placeholder="Why is this action being taken?"
              rows={3}
              className={reasonMissing ? 'border-destructive focus-visible:ring-destructive' : ''}
            />
            {reasonMissing && <p className="text-xs text-destructive">A reason is required for the audit log.</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="reason-dialog-notes">Notes (optional)</Label>
            <Textarea
              id="reason-dialog-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional context for the record"
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={destructive ? 'destructive' : 'default'} onClick={submit} loading={loading} disabled={loading}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
