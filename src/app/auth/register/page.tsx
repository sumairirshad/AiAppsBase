'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Mail, Lock, User, Eye, EyeOff, Github, ShoppingBag, Store } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { AuthShell } from '@/components/auth/auth-shell'

type Role = 'buyer' | 'seller'

export default function RegisterPage() {
  const router = useRouter()
  const [role, setRole] = useState<Role>('buyer')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const error = new URLSearchParams(window.location.search).get('error')
    if (error === 'github_no_email') toast.error('Your GitHub account has no verified email. Please sign up with email instead.')
    else if (error === 'github_failed' || error === 'invalid_state') toast.error('GitHub sign-up failed. Please try again.')
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) return toast.error('Passwords do not match')
    if (!acceptTerms) return toast.error('You must accept the terms of service')
    setIsLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, password, role }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error ?? 'Registration failed')
      toast.success('Account created! Check your email for the verification code.')
      router.push(`/auth/otp?email=${encodeURIComponent(email.trim())}`)
    } catch (error) {
      toast.error((error as Error).message || 'Registration failed')
    } finally {
      setIsLoading(false)
    }
  }

  const roles: { value: Role; label: string; icon: typeof Store; hint: string }[] = [
    { value: 'buyer', label: 'Buy projects', icon: ShoppingBag, hint: 'Discover & purchase' },
    { value: 'seller', label: 'Sell projects', icon: Store, hint: 'List & earn' },
  ]

  return (
    <AuthShell
      title="Create your account"
      subtitle="Join the marketplace for AI-built projects"
      footer={<>Already have an account? <Link href="/auth/login" className="font-medium text-primary hover:underline">Sign in</Link></>}
    >
      {/* Role selector */}
      <div className="mb-5 grid grid-cols-2 gap-3">
        {roles.map((r) => (
          <button
            key={r.value}
            type="button"
            onClick={() => setRole(r.value)}
            className={cn(
              'flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-all',
              role === r.value ? 'border-primary/50 bg-primary/5 ring-1 ring-primary/30' : 'border-border hover:border-primary/30'
            )}
          >
            <r.icon className={cn('size-5', role === r.value ? 'text-primary' : 'text-muted-foreground')} />
            <span className="text-sm font-medium">{r.label}</span>
            <span className="text-xs text-muted-foreground">{r.hint}</span>
          </button>
        ))}
      </div>

      <Button variant="outline" className="w-full" asChild>
        <a href={`/api/auth/github?role=${role}`}><Github className="size-4" /> Sign up with GitHub</a>
      </Button>

      <div className="my-5 flex items-center gap-3">
        <Separator className="flex-1" /><span className="text-xs text-muted-foreground">or</span><Separator className="flex-1" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fullName">Full name</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="John Doe" className="pl-9" required />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email address</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="pl-9" required />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="password" type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Create" className="px-9" required />
              <button type="button" onClick={() => setShowPw((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label="Toggle password">
                {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="confirmPassword" type={showPw ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repeat" className="pl-9" required />
            </div>
          </div>
        </div>

        <label className="flex cursor-pointer items-start gap-2.5 text-sm text-muted-foreground">
          <Checkbox checked={acceptTerms} onCheckedChange={(v) => setAcceptTerms(Boolean(v))} className="mt-0.5" />
          <span>
            I agree to the <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link> and{' '}
            <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
          </span>
        </label>

        <Button type="submit" variant="gradient" className="w-full" size="lg" loading={isLoading}>Create account</Button>
      </form>
    </AuthShell>
  )
}
