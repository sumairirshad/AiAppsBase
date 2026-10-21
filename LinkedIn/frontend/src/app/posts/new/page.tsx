'use client'

import { useRequireAuth } from '@/lib/auth-context'
import { PostForm } from '@/components/post-form'

export default function NewPostPage() {
  const { user, loading } = useRequireAuth()
  if (loading || !user) return null

  return (
    <div>
      <h1 className="mb-6 text-lg font-semibold text-slate-900">New post</h1>
      <PostForm />
    </div>
  )
}
