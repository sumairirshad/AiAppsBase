'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Zap, Lock } from 'lucide-react'

export default function OtpPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    setEmail(params.get('email') ?? '')
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setIsLoading(true)
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data?.error ?? 'Verification failed')

      toast.success('Email verified successfully!')
      router.push('/')
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
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-surface-950 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-brand-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-purple-500/10 rounded-full blur-3xl" />

      <div className="relative w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">AIForge</span>
          </Link>
        </div>

        <div className="glass rounded-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">Verify your email</h1>
            <p className="text-surface-400 text-sm">
              Enter the code we sent to{' '}
              <span className="font-medium text-white">{email || 'your email'}</span>.
            </p>
          </div>

          {!email ? (
            <div className="rounded-xl bg-surface-800 p-5 text-center">
              <p className="text-surface-300 mb-4">No email provided. Please go back to sign up.</p>
              <Link href="/auth/register" className="btn-primary w-full py-3">
                Back to sign up
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-surface-300 mb-1.5">
                  Verification code
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
                  <input
                    id="code"
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="123456"
                    className="input-field pl-10"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full py-3 text-center disabled:opacity-60"
              >
                {isLoading ? 'Verifying…' : 'Verify'}
              </button>

              <button
                type="button"
                disabled={isResending}
                onClick={handleResend}
                className="btn-secondary w-full py-3 text-center disabled:opacity-60"
              >
                {isResending ? 'Resending…' : 'Resend code'}
              </button>

              <p className="text-center text-sm text-surface-400">
                Already verified?{' '}
                <Link href="/auth/login" className="text-brand-400 hover:text-brand-300 font-medium">
                  Sign in
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
