'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { User, Mail, Lock, ShieldCheck, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StripeConnectCard } from '@/components/dashboard/stripe-connect-card'
import type { SellerStripeStatus } from '@/lib/dashboard'
import { sellerHandle, sellerPath } from '@/lib/seo'

export function SettingsForm({
  user, stripeStatus,
}: {
  user: {
    id?: string; full_name: string; email: string; role: string; github_username?: string | null; is_verified?: boolean
    bio?: string | null; location?: string | null; website_url?: string | null
  }
  stripeStatus?: SellerStripeStatus
}) {
  const router = useRouter()
  const [fullName, setFullName] = React.useState(user.full_name)
  const [bio, setBio] = React.useState(user.bio ?? '')
  const [location, setLocation] = React.useState(user.location ?? '')
  const [website, setWebsite] = React.useState(user.website_url ?? '')
  const [savingProfile, setSavingProfile] = React.useState(false)
  const isSeller = user.role === 'seller'

  const [current, setCurrent] = React.useState('')
  const [next, setNext] = React.useState('')
  const [confirm, setConfirm] = React.useState('')
  const [savingPw, setSavingPw] = React.useState(false)

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSavingProfile(true)
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          isSeller ? { full_name: fullName, bio, location, website_url: website } : { full_name: fullName }
        ),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update profile')
      toast.success('Profile updated')
      router.refresh()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setSavingProfile(false)
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault()
    if (next !== confirm) return toast.error('New passwords do not match')
    setSavingPw(true)
    try {
      const res = await fetch('/api/user/password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current, next }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to change password')
      toast.success('Password changed')
      setCurrent(''); setNext(''); setConfirm('')
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setSavingPw(false)
    }
  }

  return (
    <div className="grid max-w-3xl gap-6">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><User className="size-4" /> Profile</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={saveProfile} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="email" value={user.email} disabled className="pl-9" />
              </div>
              <p className="text-xs text-muted-foreground">Email is used for sign-in and can&apos;t be changed here.</p>
            </div>
            {isSeller && (
              <>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="bio">Storefront bio</Label>
                    {user.id && (
                      <Link href={sellerPath({ id: user.id, handle: sellerHandle(user) })} target="_blank" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                        View storefront <ExternalLink className="size-3" />
                      </Link>
                    )}
                  </div>
                  <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} maxLength={1000} rows={4} placeholder="Tell buyers what you build and how you use AI." />
                  <p className="text-xs text-muted-foreground">Shown publicly on your storefront. {bio.length}/1000</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} maxLength={100} placeholder="Berlin, Germany" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input id="website" value={website} onChange={(e) => setWebsite(e.target.value)} maxLength={200} placeholder="https://example.com" />
                  </div>
                </div>
              </>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="muted" className="capitalize">{user.role}</Badge>
              {user.is_verified && <Badge variant="success"><ShieldCheck className="size-3" /> Verified</Badge>}
              {user.github_username && <Badge variant="brand">GitHub: {user.github_username}</Badge>}
            </div>
            <Button type="submit" variant="gradient" loading={savingProfile}>Save changes</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Lock className="size-4" /> Security</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={changePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current">Current password</Label>
              <Input id="current" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} placeholder="••••••••" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="new">New password</Label>
                <Input id="new" type="password" value={next} onChange={(e) => setNext(e.target.value)} placeholder="••••••••" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">Confirm new password</Label>
                <Input id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" />
              </div>
            </div>
            <Button type="submit" variant="outline" loading={savingPw}>Update password</Button>
          </form>
        </CardContent>
      </Card>

      {stripeStatus && <StripeConnectCard status={stripeStatus} />}
    </div>
  )
}
