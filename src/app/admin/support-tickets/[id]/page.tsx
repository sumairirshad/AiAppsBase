'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { ArrowLeft, Send } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { PageHead } from '@/components/dashboard/page-head'

type Reply = {
  id: string
  author_name: string
  is_admin_reply: boolean
  message: string
  created_at: string
}

type TicketDetail = {
  id: string
  subject: string
  message: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  created_at: string
  user_id: string
  user_name: string
  user_email: string
  order_id: string | null
  product_id: string | null
  product_title: string | null
  replies: Reply[]
}

const statusLabel: Record<string, string> = {
  open: 'Open',
  in_progress: 'In progress',
  resolved: 'Resolved',
  closed: 'Closed',
}

function Bubble({ authorName, isAdmin, message, createdAt }: { authorName: string; isAdmin: boolean; message: string; createdAt: string }) {
  return (
    <div className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] rounded-xl px-4 py-3 ${isAdmin ? 'bg-primary/10' : 'bg-muted'}`}>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{authorName}</span>
          {isAdmin && <Badge variant="brand">Support</Badge>}
          <span>{new Date(createdAt).toLocaleString()}</span>
        </div>
        <p className="mt-1.5 whitespace-pre-wrap text-sm">{message}</p>
      </div>
    </div>
  )
}

export default function AdminSupportTicketDetailPage() {
  const params = useParams<{ id: string }>()
  const [ticket, setTicket] = useState<TicketDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  const load = () => {
    setLoading(true)
    setError(null)
    fetch(`/api/admin/support-tickets/${params.id}`)
      .then(async (r) => {
        const data = await r.json()
        if (!r.ok) throw new Error(data.error || `Error ${r.status}`)
        setTicket(data.ticket)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [params.id])

  const sendReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reply.trim()) return
    setSending(true)
    try {
      const res = await fetch(`/api/admin/support-tickets/${params.id}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: reply.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send reply')
      setReply('')
      load()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setSending(false)
    }
  }

  const changeStatus = async (status: string) => {
    if (!ticket) return
    setUpdatingStatus(true)
    try {
      const res = await fetch(`/api/admin/support-tickets/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update status')
      setTicket((prev) => (prev ? { ...prev, status: status as TicketDetail['status'] } : prev))
      toast.success(`Ticket marked ${statusLabel[status]?.toLowerCase() ?? status}`)
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setUpdatingStatus(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link href="/admin/support-tickets" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-3.5" /> Back to tickets
      </Link>

      {error ? (
        <Card><CardContent className="p-8 text-center">
          <p className="font-medium text-destructive">Failed to load ticket</p>
          <p className="mt-1 text-sm text-muted-foreground">{error}</p>
        </CardContent></Card>
      ) : loading || !ticket ? (
        <div className="space-y-3">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between gap-4">
            <PageHead
              title={ticket.subject}
              description={
                <>
                  {ticket.user_name} ({ticket.user_email})
                  {ticket.product_title && (
                    <> · <Link href={`/product/${ticket.product_id}`} className="hover:text-primary">{ticket.product_title}</Link></>
                  )}
                  {ticket.order_id && (
                    <> · <Link href={`/admin/orders`} className="hover:text-primary">Order {ticket.order_id.slice(0, 8)}</Link></>
                  )}
                </>
              }
            />
            <Select value={ticket.status} onValueChange={changeStatus} disabled={updatingStatus}>
              <SelectTrigger className="w-40 shrink-0"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <Bubble authorName={ticket.user_name} isAdmin={false} message={ticket.message} createdAt={ticket.created_at} />
            {ticket.replies.map((r) => (
              <Bubble key={r.id} authorName={r.author_name} isAdmin={r.is_admin_reply} message={r.message} createdAt={r.created_at} />
            ))}
          </div>

          <Card>
            <CardContent className="p-4">
              <form onSubmit={sendReply} className="space-y-3">
                <Textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Write a reply…"
                  rows={4}
                  maxLength={5000}
                />
                <div className="flex justify-end">
                  <Button type="submit" variant="gradient" loading={sending} disabled={sending || !reply.trim()}>
                    <Send className="size-4" /> Send reply
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
