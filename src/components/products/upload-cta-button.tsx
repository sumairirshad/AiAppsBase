'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Upload, X, LogIn, UserPlus, Zap } from 'lucide-react'

interface Props {
  label?: string
  className?: string
}

export function UploadCtaButton({ label = 'Upload Product', className = 'btn-primary' }: Props) {
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const [checking, setChecking] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!showModal) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setShowModal(false)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [showModal])

  const handleClick = async () => {
    setChecking(true)
    try {
      const res = await fetch('/api/auth/me')
      const data = await res.json()
      if (data.user) {
        router.push('/panel/seller/add-product')
      } else {
        setShowModal(true)
      }
    } catch {
      setShowModal(true)
    } finally {
      setChecking(false)
    }
  }

  const modal = (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
    >
      {/* Backdrop */}
      <div
        onClick={() => setShowModal(false)}
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
      />
      {/* Card */}
      <div style={{ position: 'relative', zIndex: 1 }} className="bg-surface-900 border border-white/10 rounded-2xl p-8 w-full max-w-sm shadow-2xl shadow-black/60">
        <button
          onClick={() => setShowModal(false)}
          className="absolute top-4 right-4 text-surface-400 hover:text-white transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-14 h-14 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mx-auto mb-5">
          <Zap className="w-7 h-7 text-brand-400" />
        </div>

        <h2 className="text-xl font-bold text-white text-center mb-2">
          Sign in to sell on AIForge
        </h2>
        <p className="text-surface-400 text-sm text-center mb-8">
          Create an account or sign in to start uploading your AI-built products and earn revenue.
        </p>

        <div className="space-y-3">
          <Link
            href="/auth/login"
            className="w-full btn-primary flex items-center justify-center gap-2"
            onClick={() => setShowModal(false)}
          >
            <LogIn className="w-4 h-4" /> Sign In
          </Link>
          <Link
            href="/auth/register"
            className="w-full btn-secondary flex items-center justify-center gap-2"
            onClick={() => setShowModal(false)}
          >
            <UserPlus className="w-4 h-4" /> Create Account
          </Link>
        </div>

        <p className="text-surface-600 text-xs text-center mt-5">
          Free to join. Sellers keep 80% of every sale.
        </p>
      </div>
    </div>
  )

  return (
    <>
      <button
        onClick={handleClick}
        disabled={checking}
        className={`${className} inline-flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed`}
      >
        <Upload className="w-4 h-4" />
        {checking ? 'Checking...' : label}
      </button>

      {mounted && showModal && createPortal(modal, document.body)}
    </>
  )
}
