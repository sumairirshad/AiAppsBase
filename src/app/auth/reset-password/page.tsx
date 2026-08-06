'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Zap, Lock, Eye, EyeOff, Check } from 'lucide-react'
import { toast } from 'sonner'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'

function strength(pw: string) {
  let score = 0
  if (pw.length >= 8) score++
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++
  if (/\d/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  return score
}

export default function ResetPasswordPage() {
  const router = useRouter()
  const [token, setToken] = React.useState<string | null | undefined>(undefined)
  const [pw, setPw] = React.useState('')
  const [confirm, setConfirm] = React.useState('')
  const [show, setShow] = React.useState(false)
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    if (typeof window === 'undefined') return
    setToken(new URLSearchParams(window.location.search).get('token'))
  }, [])

  const score = strength(pw)
  const labels = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong']
  const colors = ['bg-destructive', 'bg-destructive', 'bg-warning', 'bg-warning', 'bg-success']

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!token) return toast.error('This reset link is invalid or has expired')
    if (pw.length < 8) return toast.error('Password must be at least 8 characters')
    if (score < 2) return toast.error('Please choose a stronger password')
    if (pw !== confirm) return toast.error('Passwords do not match')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: pw }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error ?? 'Could not reset password')
      toast.success('Password updated')
      router.push('/auth/login')
    } catch (error) {
      toast.error((error as Error).message || 'Could not reset password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden px-4 py-16">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/4 h-96 w-[600px] -translate-x-1/2 rounded-full bg-primary/15 blur-[120px]" />
        <div className="absolute inset-0 bg-grid bg-grid-pattern opacity-30 mask-fade-b" />
      </div>

      <Card className="w-full max-w-md p-8 shadow-xl">
        <Link href="/" className="mb-6 flex items-center gap-2">
          <div className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-fuchsia-500 shadow-md">
            <Zap className="size-5 text-white" />
          </div>
          <span className="font-display text-lg font-bold">AIAppsBase</span>
        </Link>

        {token === null ? (
          <div className="space-y-4 text-center">
            <h1 className="font-display text-2xl font-bold">Link invalid or expired</h1>
            <p className="text-sm text-muted-foreground">
              This password reset link is missing or no longer valid. Request a new one to continue.
            </p>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/auth/forgot-password">Request a new link</Link>
            </Button>
          </div>
        ) : (
        <>
        <h1 className="font-display text-2xl font-bold">Set a new password</h1>
        <p className="mt-1 text-sm text-muted-foreground">Choose a strong password you don&apos;t use elsewhere.</p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pw">New password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="pw" type={show ? 'text' : 'password'} value={pw} onChange={(e) => setPw(e.target.value)} placeholder="••••••••" className="px-9" autoFocus />
              <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label="Toggle password visibility">
                {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {pw && (
              <div className="space-y-1">
                <div className="flex gap-1">
                  {[0, 1, 2, 3].map((i) => (
                    <span key={i} className={cn('h-1 flex-1 rounded-full', i < score ? colors[score] : 'bg-muted')} />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">{labels[score]}</p>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm">Confirm password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="confirm" type={show ? 'text' : 'password'} value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" className="pl-9" />
              {confirm && pw === confirm && <Check className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-success" />}
            </div>
          </div>
          <Button type="submit" variant="gradient" className="w-full" loading={loading}>Update password</Button>
        </form>
        </>
        )}
      </Card>
    </div>
  )
}
