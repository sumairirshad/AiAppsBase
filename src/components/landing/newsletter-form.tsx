'use client'

import * as React from 'react'
import { Mail, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function NewsletterForm() {
  const [email, setEmail] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [done, setDone] = React.useState(false)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Please enter a valid email address')
      return
    }
    setLoading(true)
    // Simulated subscribe — wired to a real endpoint in a later phase.
    setTimeout(() => {
      setLoading(false)
      setDone(true)
      toast.success('You’re subscribed! Check your inbox.')
    }, 900)
  }

  if (done) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm font-medium text-success">
        <CheckCircle2 className="size-5" /> You’re on the list — welcome aboard!
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="flex w-full flex-col gap-3 sm:flex-row">
      <div className="relative flex-1">
        <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          className="h-12 pl-10"
          aria-label="Email address"
        />
      </div>
      <Button type="submit" size="lg" variant="gradient" loading={loading} className="h-12">
        Subscribe
      </Button>
    </form>
  )
}
