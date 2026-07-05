'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { User, Mail, Lock, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function SettingsForm({
  user,
}: {
  user: { full_name: string; email: string; role: string; github_username?: string | null; is_verified?: boolean }
}) {
  const router = useRouter()
  const [fullName, setFullName] = React.useState(user.full_name)
  const [savingProfile, setSavingProfile] = React.useState(false)

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
        body: JSON.stringify({ full_name: fullName }),
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
    </div>
  )
}
