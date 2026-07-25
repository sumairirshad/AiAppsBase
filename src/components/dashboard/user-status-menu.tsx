'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { ShieldCheck, ShieldAlert, ShieldX, Ban, UserX } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { ReasonDialog } from '@/components/dashboard/reason-dialog'

const STATUS_META: Record<string, { label: string; past: string; icon: any; destructive?: boolean }> = {
  active: { label: 'Activate', past: 'activated', icon: ShieldCheck },
  suspended: { label: 'Suspend', past: 'suspended', icon: ShieldAlert },
  blocked: { label: 'Block', past: 'blocked', icon: ShieldX },
  banned: { label: 'Ban', past: 'banned', icon: Ban, destructive: true },
  inactive: { label: 'Deactivate', past: 'deactivated', icon: UserX },
}

export function UserStatusMenu({
  userId, currentStatus, onUpdated, size = 'sm',
}: {
  userId: string
  currentStatus: string
  onUpdated?: (accountStatus: string) => void
  size?: 'sm' | 'default'
}) {
  const [pending, setPending] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const submit = async (reason: string, notes: string) => {
    if (!pending) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountStatus: pending, reason, notes }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update user')
      toast.success(`User ${STATUS_META[pending].past}`)
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
          <DropdownMenuLabel>Change account status</DropdownMenuLabel>
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
        title={active ? `${active.label} this user?` : ''}
        description="This action requires a reason and will be recorded in the audit log."
        confirmLabel={active?.label ?? 'Confirm'}
        destructive={active?.destructive}
        loading={loading}
        onConfirm={submit}
      />
    </>
  )
}
