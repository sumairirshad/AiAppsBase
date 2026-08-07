'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { CheckCircle, XCircle, ShieldAlert, Ban } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { ReasonDialog } from '@/components/dashboard/reason-dialog'

const STATUS_META: Record<string, { label: string; past: string; icon: any; destructive?: boolean }> = {
  approved: { label: 'Approve', past: 'approved', icon: CheckCircle },
  rejected: { label: 'Reject', past: 'rejected', icon: XCircle, destructive: true },
  suspended: { label: 'Suspend', past: 'suspended', icon: ShieldAlert },
  banned: { label: 'Ban', past: 'banned', icon: Ban, destructive: true },
}

export function SellerStatusMenu({
  sellerId, currentStatus, onUpdated, size = 'sm',
}: {
  sellerId: string
  currentStatus: string
  onUpdated?: (sellerStatus: string) => void
  size?: 'sm' | 'default'
}) {
  const [pending, setPending] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const submit = async (reason: string, notes: string) => {
    if (!pending) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/sellers/${sellerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sellerStatus: pending, reason, notes }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update provider')
      toast.success(`Provider ${STATUS_META[pending].past}`)
      onUpdated?.(pending)
      setPending(null)
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const active = pending ? STATUS_META[pending] : null

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size={size}>Actions</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Change provider status</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {Object.entries(STATUS_META)
            .filter(([key]) => key !== currentStatus)
            .map(([key, meta]) => (
              <DropdownMenuItem
                key={key}
                onClick={() => setPending(key)}
                className={meta.destructive ? 'text-destructive focus:text-destructive [&_svg]:text-destructive' : ''}
              >
                <meta.icon className="size-4" /> {meta.label}
              </DropdownMenuItem>
            ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <ReasonDialog
        open={pending !== null}
        onOpenChange={(open) => !open && setPending(null)}
        title={active ? `${active.label} this provider?` : ''}
        description="This action requires a reason and will be recorded in the audit log."
        confirmLabel={active?.label ?? 'Confirm'}
        destructive={active?.destructive}
        loading={loading}
        onConfirm={submit}
      />
    </>
  )
}
