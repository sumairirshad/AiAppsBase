'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useRequireAuth } from '@/lib/auth-context'
import { api, ApiError } from '@/lib/api'
import type { Post } from '@/lib/types'
import { PostForm } from '@/components/post-form'

export default function EditPostPage() {
  const { user, loading: authLoading } = useRequireAuth()
  const params = useParams<{ id: string }>()
  const [post, setPost] = useState<Post | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    api
      .get<Post>(`/api/posts/${params.id}`)
      .then(setPost)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load post.'))
      .finally(() => setLoading(false))
  }, [user, params.id])

  if (authLoading || !user) return null
  if (loading) return <p className="text-sm text-slate-500">Loading…</p>
  if (error) return <p className="text-sm text-red-600">{error}</p>
  if (!post) return null

  return (
    <div>
      <h1 className="mb-6 text-lg font-semibold text-slate-900">Edit post</h1>
      <PostForm existing={post} />
    </div>
  )
}
