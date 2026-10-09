'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Upload, LogIn, UserPlus, Zap } from 'lucide-react'

import { Button, type ButtonProps } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose,
} from '@/components/ui/dialog'

interface Props {
  label?: string
  className?: string
  variant?: ButtonProps['variant']
  size?: ButtonProps['size']
}

export function UploadCtaButton({ label = 'Upload Product', className, variant = 'gradient', size }: Props) {
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const [checking, setChecking] = useState(false)

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

  return (
    <>
      <Button onClick={handleClick} disabled={checking} variant={variant} size={size} className={className}>
        <Upload className="size-4" />
        {checking ? 'Checking...' : label}
      </Button>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-sm text-center">
          <div className="mx-auto grid size-14 place-items-center rounded-2xl border border-primary/20 bg-primary/10">
            <Zap className="size-7 text-primary" />
          </div>
          <DialogHeader className="text-center">
            <DialogTitle className="text-center">Sign in to sell on AIAppsBase</DialogTitle>
            <DialogDescription className="text-center">
              Create an account or sign in to start uploading your AI-built products and earn revenue.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <DialogClose asChild>
              <Button variant="gradient" className="w-full" asChild>
                <Link href="/auth/login"><LogIn className="size-4" /> Sign In</Link>
              </Button>
            </DialogClose>
            <DialogClose asChild>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/auth/register"><UserPlus className="size-4" /> Create Account</Link>
              </Button>
            </DialogClose>
          </div>

          <p className="text-xs text-muted-foreground">Free to join. Sellers keep 80% of every sale.</p>
        </DialogContent>
      </Dialog>
    </>
  )
}
