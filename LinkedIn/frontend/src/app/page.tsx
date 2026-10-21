'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRequireAuth } from '@/lib/auth-context'
import { api, ApiError } from '@/lib/api'
import type { Post, PostStatus } from '@/lib/types'
import { CONTENT_TYPE_LABELS } from '@/lib/types'
import { StatusBadge } from '@/components/status-badge'

const STATUS_FILTERS: Array<PostStatus | 'All'> = ['All', 'Draft', 'Scheduled', 'Publishing', 'Published', 'Failed']

export default function DashboardPage() {
  const { user, loading: authLoading } = useRequireAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<PostStatus | 'All'>('All')
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      const query = filter === 'All' ? '' : `?status=${filter}`
      const data = await api.get<Post[]>(`/api/posts${query}`)
      setPosts(data)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load posts.')
    } finally {
      setLoading(false)
    }
  }, [user, filter])

  useEffect(() => {
    load()
  }, [load])

  async function publishNow(id: string) {
    setBusyId(id)
    try {
      await api.post(`/api/posts/${id}/publish-now`)
    } catch {
      // The post's own status/publishError (reloaded below) already explains the failure.
    } finally {
      setBusyId(null)
      load()
    }
  }

  async function retry(id: string) {
    setBusyId(id)
    try {
      await api.post(`/api/posts/${id}/retry`)
    } finally {
      setBusyId(null)
      load()
    }
  }

  async function remove(id: string) {
    if (!confirm('Delete this post?')) return
    setBusyId(id)
    try {
      await api.delete(`/api/posts/${id}`)
      load()
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Failed to delete post.')
    } finally {
      setBusyId(null)
    }
  }

  if (authLoading || !user) return null

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-900">Posts</h1>
        <Link href="/posts/new" className="rounded-md bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-700">
          New post
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              filter === status ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      {loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : posts.length === 0 ? (
        <p className="text-sm text-slate-500">No posts yet. Create one to get started.</p>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <div key={post.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <StatusBadge status={post.status} />
                    <span className="text-xs text-slate-500">{CONTENT_TYPE_LABELS[post.contentType]}</span>
                  </div>
                  <p className="line-clamp-2 text-sm text-slate-800">{post.title ? `${post.title} — ` : ''}{post.body}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {post.scheduledAt ? `Scheduled: ${new Date(post.scheduledAt).toLocaleString()}` : 'Not scheduled'}
                    {post.publishedAt ? ` · Published: ${new Date(post.publishedAt).toLocaleString()}` : ''}
                  </p>
                  {post.publishError && (
                    <p className="mt-1 text-xs text-red-600">
                      {post.publishError} ({post.publishAttempts} attempt{post.publishAttempts === 1 ? '' : 's'})
                    </p>
                  )}
                  {post.linkedInPostUrn && <p className="mt-1 text-xs text-slate-500">URN: {post.linkedInPostUrn}</p>}
                </div>
                <div className="flex shrink-0 flex-col gap-1.5">
                  {(post.status === 'Draft' || post.status === 'Scheduled') && (
                    <Link
                      href={`/posts/${post.id}`}
                      className="rounded-md border border-slate-300 px-2.5 py-1 text-center text-xs font-medium hover:bg-slate-50"
                    >
                      Edit
                    </Link>
                  )}
                  {(post.status === 'Draft' || post.status === 'Scheduled') && (
                    <button
                      disabled={busyId === post.id}
                      onClick={() => publishNow(post.id)}
                      className="rounded-md bg-sky-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-sky-700 disabled:opacity-60"
                    >
                      Publish now
                    </button>
                  )}
                  {post.status === 'Failed' && (
                    <button
                      disabled={busyId === post.id}
                      onClick={() => retry(post.id)}
                      className="rounded-md bg-amber-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-amber-700 disabled:opacity-60"
                    >
                      Retry
                    </button>
                  )}
                  {post.status !== 'Published' && post.status !== 'Publishing' && (
                    <button
                      disabled={busyId === post.id}
                      onClick={() => remove(post.id)}
                      className="rounded-md border border-red-300 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
