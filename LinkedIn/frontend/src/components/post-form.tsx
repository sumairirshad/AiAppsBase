'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api, ApiError } from '@/lib/api'
import type { CaptionTemplate, MediaAsset, MediaKind, Post, PostContentType } from '@/lib/types'
import { CONTENT_TYPE_LABELS, MEDIA_KIND_FOR_CONTENT_TYPE } from '@/lib/types'

const CONTENT_TYPES: PostContentType[] = ['Text', 'Image', 'MultiImage', 'Video', 'Document', 'ArticleLink']
const BODY_LIMIT = 3000
const TITLE_LIMIT = 255

function mediaCountHint(contentType: PostContentType): string {
  switch (contentType) {
    case 'Image':
      return 'Attach exactly 1 image.'
    case 'MultiImage':
      return 'Attach 2 to 20 images.'
    case 'Video':
      return 'Attach exactly 1 video.'
    case 'Document':
      return 'Attach exactly 1 PDF, and set a title.'
    default:
      return ''
  }
}

function toLocalDateTimeInputValue(iso: string | null): string {
  if (!iso) return ''
  const date = new Date(iso)
  const offset = date.getTimezoneOffset()
  const local = new Date(date.getTime() - offset * 60 * 1000)
  return local.toISOString().slice(0, 16)
}

export function PostForm({ existing }: { existing?: Post }) {
  const router = useRouter()
  const isEdit = Boolean(existing)

  const [contentType, setContentType] = useState<PostContentType>(existing?.contentType ?? 'Text')
  const [title, setTitle] = useState(existing?.title ?? '')
  const [body, setBody] = useState(existing?.body ?? '')
  const [externalLinkUrl, setExternalLinkUrl] = useState(existing?.externalLinkUrl ?? '')
  const [scheduledAt, setScheduledAt] = useState(toLocalDateTimeInputValue(existing?.scheduledAt ?? null))
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>(existing?.media ?? [])
  const [templates, setTemplates] = useState<CaptionTemplate[]>([])
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api
      .get<CaptionTemplate[]>(`/api/caption-templates?contentType=${contentType}`)
      .then(setTemplates)
      .catch(() => setTemplates([]))
  }, [contentType])

  const requiredKind: MediaKind | undefined = MEDIA_KIND_FOR_CONTENT_TYPE[contentType]

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0 || !requiredKind) return
    setUploading(true)
    setError(null)
    try {
      const uploaded: MediaAsset[] = []
      for (const file of Array.from(files)) {
        const form = new FormData()
        form.append('file', file)
        form.append('kind', requiredKind)
        uploaded.push(await api.upload<MediaAsset>('/api/media/upload', form))
      }
      setMediaAssets((prev) => (contentType === 'MultiImage' ? [...prev, ...uploaded] : uploaded))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  function removeMedia(id: string) {
    setMediaAssets((prev) => prev.filter((m) => m.id !== id))
  }

  function applyTemplate(templateId: string) {
    const template = templates.find((t) => t.id === templateId)
    if (template) setBody(template.templateBody)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const payload = {
      contentType,
      title: title.trim() || null,
      body,
      externalLinkUrl: externalLinkUrl.trim() || null,
      scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
      mediaAssetIds: mediaAssets.map((m) => m.id),
    }

    try {
      if (isEdit && existing) {
        await api.put(`/api/posts/${existing.id}`, payload)
      } else {
        await api.post('/api/posts', payload)
      }
      router.push('/')
      router.refresh()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save post.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Content type</label>
        <select
          value={contentType}
          onChange={(e) => {
            setContentType(e.target.value as PostContentType)
            setMediaAssets([])
          }}
          disabled={isEdit && existing?.status === 'Published'}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          {CONTENT_TYPES.map((ct) => (
            <option key={ct} value={ct}>
              {CONTENT_TYPE_LABELS[ct]}
            </option>
          ))}
        </select>
      </div>

      {contentType === 'ArticleLink' && (
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">External link URL</label>
          <input
            type="url"
            required
            value={externalLinkUrl}
            onChange={(e) => setExternalLinkUrl(e.target.value)}
            placeholder="https://tisoroglobal.com/article-slug"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <p className="mt-1 text-xs text-slate-500">
            LinkedIn has no public API to create a native Article — publish the article on linkedin.com first, then
            use this to schedule the announcement post linking to it.
          </p>
        </div>
      )}

      {(contentType === 'Document' || contentType === 'ArticleLink') && (
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Title {contentType === 'Document' && <span className="text-red-600">*</span>}
          </label>
          <input
            type="text"
            maxLength={TITLE_LIMIT}
            required={contentType === 'Document'}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <p className="mt-1 text-xs text-slate-500">{title.length}/{TITLE_LIMIT} characters</p>
        </div>
      )}

      {requiredKind && (
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Media</label>
          <p className="mb-2 text-xs text-slate-500">{mediaCountHint(contentType)}</p>
          <input
            type="file"
            multiple={contentType === 'MultiImage'}
            accept={requiredKind === 'Image' ? 'image/*' : requiredKind === 'Video' ? 'video/*' : 'application/pdf'}
            onChange={(e) => handleUpload(e.target.files)}
            disabled={uploading}
            className="block w-full text-sm"
          />
          {uploading && <p className="mt-1 text-xs text-slate-500">Uploading…</p>}
          {mediaAssets.length > 0 && (
            <ul className="mt-2 space-y-1">
              {mediaAssets.map((m) => (
                <li key={m.id} className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-1.5 text-xs">
                  <span>{m.originalFileName} ({Math.round(m.sizeBytes / 1024)} KB)</span>
                  <button type="button" onClick={() => removeMedia(m.id)} className="font-medium text-red-600">
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {templates.length > 0 && (
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Caption template</label>
          <select
            onChange={(e) => e.target.value && applyTemplate(e.target.value)}
            defaultValue=""
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Select a template to fill the caption…</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Caption</label>
        <textarea
          required
          rows={10}
          maxLength={BODY_LIMIT}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <p className={`mt-1 text-xs ${body.length > BODY_LIMIT ? 'text-red-600' : 'text-slate-500'}`}>
          {body.length}/{BODY_LIMIT} characters
        </p>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Schedule for (leave blank to save as a draft)</label>
        <input
          type="datetime-local"
          value={scheduledAt}
          onChange={(e) => setScheduledAt(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={submitting || uploading}
          className="rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-60"
        >
          {submitting ? 'Saving…' : isEdit ? 'Save changes' : scheduledAt ? 'Schedule post' : 'Save as draft'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/')}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
