'use client'

import { useEffect, useState } from 'react'
import { useRequireAuth } from '@/lib/auth-context'
import { api, ApiError } from '@/lib/api'
import type { CaptionTemplate, PostContentType } from '@/lib/types'
import { CONTENT_TYPE_LABELS } from '@/lib/types'

const CONTENT_TYPES: PostContentType[] = ['Text', 'Image', 'MultiImage', 'Video', 'Document', 'ArticleLink']

export default function TemplatesPage() {
  const { user, loading: authLoading } = useRequireAuth()
  const [templates, setTemplates] = useState<CaptionTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ contentType: 'Text' as PostContentType, title: '', templateBody: '', characterLimit: '' })

  function load() {
    setLoading(true)
    api
      .get<CaptionTemplate[]>('/api/caption-templates')
      .then(setTemplates)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load templates.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (user) load()
  }, [user])

  async function createTemplate(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await api.post('/api/caption-templates', {
        contentType: form.contentType,
        title: form.title,
        templateBody: form.templateBody,
        characterLimit: form.characterLimit ? Number(form.characterLimit) : null,
      })
      setForm({ contentType: 'Text', title: '', templateBody: '', characterLimit: '' })
      setCreating(false)
      load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create template.')
    }
  }

  async function remove(id: string) {
    if (!confirm('Delete this template?')) return
    try {
      await api.delete(`/api/caption-templates/${id}`)
      load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete template.')
    }
  }

  if (authLoading || !user) return null

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-900">Caption templates</h1>
        <button
          onClick={() => setCreating((v) => !v)}
          className="rounded-md bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-700"
        >
          {creating ? 'Cancel' : 'New template'}
        </button>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {creating && (
        <form onSubmit={createTemplate} className="mb-6 space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <select
            value={form.contentType}
            onChange={(e) => setForm((f) => ({ ...f, contentType: e.target.value as PostContentType }))}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            {CONTENT_TYPES.map((ct) => (
              <option key={ct} value={ct}>{CONTENT_TYPE_LABELS[ct]}</option>
            ))}
          </select>
          <input
            required
            placeholder="Template title"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <textarea
            required
            rows={6}
            placeholder="Template body"
            value={form.templateBody}
            onChange={(e) => setForm((f) => ({ ...f, templateBody: e.target.value }))}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            type="number"
            placeholder="Character limit (optional)"
            value={form.characterLimit}
            onChange={(e) => setForm((f) => ({ ...f, characterLimit: e.target.value }))}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <button type="submit" className="rounded-md bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-700">
            Save template
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : (
        <div className="space-y-3">
          {templates.map((t) => (
            <div key={t.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-1 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-900">{t.title}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{CONTENT_TYPE_LABELS[t.contentType]}</span>
                </div>
                <button onClick={() => remove(t.id)} className="text-xs font-medium text-red-600">Delete</button>
              </div>
              <pre className="whitespace-pre-wrap text-xs text-slate-600">{t.templateBody}</pre>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
