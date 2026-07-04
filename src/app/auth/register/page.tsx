'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Zap, Mail, Lock, User } from 'lucide-react'

type Role = 'buyer' | 'seller'

export default function RegisterPage() {
  const router = useRouter()
  const [role, setRole] = useState<Role>('buyer')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (!acceptTerms) {
      toast.error('You must accept the terms of service')
      return
    }

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

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-surface-950 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-brand-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-purple-500/10 rounded-full blur-3xl" />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">AIAppsBase</span>
          </Link>
        </div>

        {/* Card */}
        <div className="glass rounded-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">Create your account</h1>
            <p className="text-surface-400 text-sm">Join the AI-built marketplace</p>
          </div>

          {/* Role selector tabs */}
          <div className="flex rounded-lg bg-surface-800/50 border border-surface-700 p-1 mb-6">
            <button
              type="button"
              onClick={() => setRole('buyer')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                role === 'buyer'
                  ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/25'
                  : 'text-surface-400 hover:text-white'
              }`}
            >
              Buyer
            </button>
            <button
              type="button"
              onClick={() => setRole('seller')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                role === 'seller'
                  ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/25'
                  : 'text-surface-400 hover:text-white'
              }`}
            >
              Seller
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full name */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-surface-300 mb-1.5">
                Full name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  className="input-field pl-10"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-surface-300 mb-1.5">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input-field pl-10"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-surface-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  className="input-field pl-10"
                  required
                />
              </div>
            </div>

            {/* Confirm password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-surface-300 mb-1.5">
                Confirm password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  className="input-field pl-10"
                  required
                />
              </div>
            </div>

            {/* Terms acceptance */}
            <div className="flex items-start gap-2.5">
              <input
                id="accept-terms"
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded border-surface-600 bg-surface-800 text-brand-500 focus:ring-brand-500 focus:ring-offset-0 cursor-pointer"
                required
              />
              <div className="text-sm text-surface-400">
                <label htmlFor="accept-terms" className="cursor-pointer">
                  I agree to the{' '}
                </label>
                <Link href="/terms" className="text-brand-400 hover:text-brand-300 transition-colors">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-brand-400 hover:text-brand-300 transition-colors">
                  Privacy Policy
                </Link>
              </div>
            </div>

            {/* Sign up button */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-3 text-center disabled:opacity-60"
            >
              {isLoading ? 'Signing up…' : 'Sign Up'}
            </button>
          </form>


          {/* Sign in link */}
          <p className="mt-6 text-center text-sm text-surface-400">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
