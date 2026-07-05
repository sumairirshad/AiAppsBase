'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { MailCheck } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { AuthShell } from '@/components/auth/auth-shell'

const LEN = 6

function OtpInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const refs = useRef<(HTMLInputElement | null)[]>([])
  const digits = value.split('')

  const setAt = (i: number, d: string) => {
    const next = value.split('')
    next[i] = d
    onChange(next.join('').slice(0, LEN))
  }

  return (
    <div className="flex justify-between gap-2">
      {Array.from({ length: LEN }).map((_, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el }}
          inputMode="numeric"
          maxLength={1}
          value={digits[i] ?? ''}
          onChange={(e) => {
            const d = e.target.value.replace(/\D/g, '').slice(-1)
            setAt(i, d)
            if (d && i < LEN - 1) refs.current[i + 1]?.focus()
          }}
          onKeyDown={(e) => {
            if (e.key === 'Backspace' && !digits[i] && i > 0) refs.current[i - 1]?.focus()
          }}
          onPaste={(e) => {
            e.preventDefault()
            const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, LEN)
            if (pasted) { onChange(pasted); refs.current[Math.min(pasted.length, LEN - 1)]?.focus() }
          }}
          className={cn(
            'h-14 w-full rounded-xl border border-input bg-background text-center font-display text-2xl font-bold shadow-sm outline-none transition-colors',
            'focus:border-transparent focus:ring-2 focus:ring-ring'
          )}
        />
      ))}
    </div>
  )
}

export default function OtpPage() {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    setEmail(new URLSearchParams(window.location.search).get('email') ?? '')
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setIsLoading(true)
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error ?? 'Verification failed')
      if (data.token) localStorage.setItem('auth_token', data.token)
      toast.success('Email verified successfully!')
      window.location.href = '/'
    } catch (error) {
      toast.error((error as Error).message || 'Verification failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    if (!email) return
    setIsResending(true)
    try {
      const res = await fetch('/api/auth/resend-otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error ?? 'Could not resend code')
      toast.success('A new code was sent to your email')
    } catch (error) {
      toast.error((error as Error).message || 'Could not resend code')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <AuthShell
      title="Verify your email"
      subtitle={email ? `Enter the 6-digit code we sent to ${email}` : 'Confirm your email to continue'}
      footer={<>Already verified? <Link href="/auth/login" className="font-medium text-primary hover:underline">Sign in</Link></>}
    >
      {!email ? (
        <div className="rounded-xl border border-border bg-card p-6 text-center">
          <MailCheck className="mx-auto mb-3 size-8 text-muted-foreground" />
          <p className="mb-4 text-sm text-muted-foreground">No email provided. Please go back to sign up.</p>
          <Button variant="gradient" className="w-full" asChild><Link href="/auth/register">Back to sign up</Link></Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <OtpInput value={code} onChange={setCode} />
          <Button type="submit" variant="gradient" className="w-full" size="lg" loading={isLoading} disabled={code.length < LEN}>
            Verify email
          </Button>
          <div className="text-center text-sm text-muted-foreground">
            Didn&apos;t get a code?{' '}
            <button type="button" onClick={handleResend} disabled={isResending} className="font-medium text-primary hover:underline disabled:opacity-60">
              {isResending ? 'Resending…' : 'Resend'}
            </button>
          </div>
        </form>
      )}
    </AuthShell>
  )
}
