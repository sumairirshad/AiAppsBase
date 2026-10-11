'use client'

import * as React from 'react'
import Link from 'next/link'
import { Mail, Check, X } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { BrandLogo } from '@/components/brand-logo'

export default function ConfirmEmailPage() {
  const [token, setToken] = React.useState<string | null | undefined>(undefined)
  const [status, setStatus] = React.useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [message, setMessage] = React.useState('')
  const [confirmedEmail, setConfirmedEmail] = React.useState('')

  React.useEffect(() => {
    if (typeof window === 'undefined') return
    setToken(new URLSearchParams(window.location.search).get('token'))
  }, [])

  async function confirm() {
    if (!token) return
    setStatus('loading')
    try {
      const res = await fetch('/api/user/email/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error ?? 'Could not confirm this email change')
      setConfirmedEmail(data.email)
      setStatus('done')
    } catch (error) {
      setMessage((error as Error).message || 'Could not confirm this email change')
      setStatus('error')
      toast.error((error as Error).message || 'Could not confirm this email change')
    }
  }

  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden px-4 py-16">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/4 h-96 w-[600px] -translate-x-1/2 rounded-full bg-primary/15 blur-[120px]" />
        <div className="absolute inset-0 bg-grid bg-grid-pattern opacity-30 mask-fade-b" />
      </div>

      <Card className="w-full max-w-md p-8 text-center shadow-xl">
        <BrandLogo className="mx-auto mb-6" />

        {token === null ? (
          <div className="space-y-4">
            <h1 className="font-display text-2xl font-bold">Link invalid or expired</h1>
            <p className="text-sm text-muted-foreground">
              This email confirmation link is missing or no longer valid. Start the change again from your account settings.
            </p>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/panel/settings">Back to settings</Link>
            </Button>
          </div>
        ) : status === 'done' ? (
          <div className="space-y-4">
            <div className="mx-auto grid size-12 place-items-center rounded-full bg-success/10 text-success">
              <Check className="size-6" />
            </div>
            <h1 className="font-display text-2xl font-bold">Email updated</h1>
            <p className="text-sm text-muted-foreground">
              Your account email is now <span className="font-medium text-foreground">{confirmedEmail}</span>. Sign in again with it to continue.
            </p>
            <Button variant="gradient" className="w-full" asChild>
              <Link href="/auth/login">Sign in</Link>
            </Button>
          </div>
        ) : status === 'error' ? (
          <div className="space-y-4">
            <div className="mx-auto grid size-12 place-items-center rounded-full bg-destructive/10 text-destructive">
              <X className="size-6" />
            </div>
            <h1 className="font-display text-2xl font-bold">Could not confirm</h1>
            <p className="text-sm text-muted-foreground">{message}</p>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/panel/settings">Back to settings</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="mx-auto grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
              <Mail className="size-6" />
            </div>
            <h1 className="font-display text-2xl font-bold">Confirm your new email</h1>
            <p className="text-sm text-muted-foreground">Click below to finish moving your account to this email address.</p>
            <Button variant="gradient" className="w-full" loading={status === 'loading'} onClick={confirm}>
              Confirm email change
            </Button>
          </div>
        )}
      </Card>
    </div>
  )
}
