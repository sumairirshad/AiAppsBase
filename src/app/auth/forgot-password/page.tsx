'use client'

import * as React from 'react'
import Link from 'next/link'
import { Zap, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'

export default function ForgotPasswordPage() {
  const [email, setEmail] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [sent, setSent] = React.useState(false)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Please enter a valid email address')
      return
    }
    setLoading(true)
    setTimeout(() => { setLoading(false); setSent(true); toast.success('Reset link sent') }, 900)
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

        {sent ? (
          <div className="space-y-4 text-center">
            <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-success/10 text-success">
              <CheckCircle2 className="size-7" />
            </div>
            <h1 className="font-display text-2xl font-bold">Check your inbox</h1>
            <p className="text-sm text-muted-foreground">
              If an account exists for <span className="font-medium text-foreground">{email}</span>, we&apos;ve sent a link to reset your password.
            </p>
            <Button variant="outline" className="w-full" asChild><Link href="/auth/login"><ArrowLeft className="size-4" /> Back to sign in</Link></Button>
          </div>
        ) : (
          <>
            <h1 className="font-display text-2xl font-bold">Forgot your password?</h1>
            <p className="mt-1 text-sm text-muted-foreground">Enter your email and we&apos;ll send you a reset link.</p>
            <form onSubmit={submit} className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" className="pl-9" autoFocus />
                </div>
              </div>
              <Button type="submit" variant="gradient" className="w-full" loading={loading}>Send reset link</Button>
            </form>
            <Link href="/auth/login" className="mt-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="size-4" /> Back to sign in
            </Link>
          </>
        )}
      </Card>
    </div>
  )
}
