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
import { PageHead } from '@/components/dashboard/page-head'

type Reply = {
  id: string
  author_id: string
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
  product_title: string | null
  replies: Reply[]
}

const statusVariant: Record<string, 'warning' | 'brand' | 'success' | 'muted'> = {
  open: 'warning',
  in_progress: 'brand',
  resolved: 'success',
  closed: 'muted',
}
const statusLabel: Record<string, string> = {
  open: 'Open',
  in_progress: 'In progress',
  resolved: 'Resolved',
  closed: 'Closed',
}

function Bubble({ authorName, isAdmin, message, createdAt }: { authorName: string; isAdmin: boolean; message: string; createdAt: string }) {
  return (
    <div className={`flex ${isAdmin ? 'justify-start' : 'justify-end'}`}>
      <div className={`max-w-[85%] rounded-xl px-4 py-3 ${isAdmin ? 'bg-muted' : 'bg-primary/10'}`}>
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

export default function SupportTicketDetailPage() {
  const params = useParams<{ id: string }>()
  const [ticket, setTicket] = useState<TicketDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)

  const load = () => {
    setLoading(true)
    setError(null)
    fetch(`/api/support/tickets/${params.id}`)
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
      const res = await fetch(`/api/support/tickets/${params.id}/replies`, {
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

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link href="/support/tickets" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
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
              description={ticket.product_title ? `About ${ticket.product_title}` : `Opened ${new Date(ticket.created_at).toLocaleDateString()}`}
            />
            <Badge variant={statusVariant[ticket.status] ?? 'muted'} className="shrink-0">
              {statusLabel[ticket.status] ?? ticket.status}
            </Badge>
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
                  placeholder={ticket.status === 'resolved' || ticket.status === 'closed' ? 'Still an issue? Reply to reopen this ticket.' : 'Write a reply…'}
                  rows={4}
                  maxLength={5000}
                />
                <div className="flex justify-end">
                  <Button type="submit" variant="gradient" loading={sending} disabled={sending || !reply.trim()}>
                    <Send className="size-4" /> Send
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
