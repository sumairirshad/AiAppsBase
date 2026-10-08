'use client'

import * as React from 'react'
import { Facebook, Twitter, Linkedin, Mail, MessageCircle, Copy, Check } from 'lucide-react'
import { toast } from 'sonner'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'

const PLATFORMS: {
  label: string
  icon: typeof Facebook
  shareHref: (url: string, title: string) => string
}[] = [
  {
    label: 'X',
    icon: Twitter,
    shareHref: (url, title) => `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
  },
  {
    label: 'Facebook',
    icon: Facebook,
    shareHref: (url) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  {
    label: 'LinkedIn',
    icon: Linkedin,
    shareHref: (url) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  },
  {
    label: 'WhatsApp',
    icon: MessageCircle,
    shareHref: (url, title) => `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`,
  },
  {
    label: 'Email',
    icon: Mail,
    shareHref: (url, title) => `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`,
  },
]

export function ShareModal({
  open, onOpenChange, title,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
}) {
  const [url, setUrl] = React.useState('')
  const [copied, setCopied] = React.useState(false)

  React.useEffect(() => {
    if (open && typeof window !== 'undefined') setUrl(window.location.href)
  }, [open])

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast.success('Link copied')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Could not copy the link')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share this project</DialogTitle>
          <DialogDescription className="truncate">{title}</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          {PLATFORMS.map((p) => (
            <a
              key={p.label}
              href={p.shareHref(url, title)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-2 rounded-xl border border-border p-3 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:bg-accent hover:text-foreground"
            >
              <span className="grid size-10 place-items-center rounded-full bg-muted">
                <p.icon className="size-5" />
              </span>
              {p.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Input
            readOnly
            value={url}
            onFocus={(e) => e.currentTarget.select()}
            className="flex-1 text-sm"
            aria-label="Product link"
          />
          <Button type="button" variant="outline" onClick={copyLink} className={cn('shrink-0', copied && 'text-success')}>
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            {copied ? 'Copied' : 'Copy link'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
