'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, UploadCloud, GitBranch, CheckCircle2, XCircle, Clock, Rocket } from 'lucide-react'
import toast from 'react-hot-toast'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHead } from '@/components/dashboard/page-head'
import { EmptyState } from '@/components/dashboard/empty-state'

type VersionRow = {
  id: string
  version: string
  deliveryType: 'upload' | 'github'
  status: 'publishing' | 'published' | 'failed'
  releaseNotes: string | null
  notifyBuyers: boolean
  isCurrent: boolean
  isLegacySnapshot: boolean
  githubRepoName: string | null
  githubCommitSha: string | null
  deliverableOriginalName: string | null
  deliverableSizeBytes: number | null
  createdAt: string
  publishedAt: string | null
}

const statusVariant: Record<string, 'success' | 'destructive' | 'warning'> = {
  published: 'success', failed: 'destructive', publishing: 'warning',
}

function formatBytes(bytes: number | null): string {
  if (!bytes) return '—'
  const units = ['B', 'KB', 'MB', 'GB']
  let i = 0, n = bytes
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i++ }
  return `${n.toFixed(n < 10 && i > 0 ? 1 : 0)} ${units[i]}`
}

export default function ProductVersionsPage() {
  const { id } = useParams<{ id: string }>()
  const [product, setProduct] = useState<any | null>(null)
  const [history, setHistory] = useState<VersionRow[]>([])
  const [loading, setLoading] = useState(true)

  const [version, setVersion] = useState('')
  const [releaseNotes, setReleaseNotes] = useState('')
  const [notifyBuyers, setNotifyBuyers] = useState(false)
  const [deliverableFile, setDeliverableFile] = useState<File | null>(null)
  const [githubRef, setGithubRef] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [showConfirm, setShowConfirm] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [productRes, versionsRes] = await Promise.all([
        fetch(`/api/products/${id}`),
        fetch(`/api/products/${id}/versions`),
      ])
      const productData = await productRes.json()
      const versionsData = await versionsRes.json()
      setProduct(productData.product ?? null)
      setHistory(versionsData.versions ?? [])
    } catch {
      toast.error('Failed to load version history')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  const isGithub = Boolean(product?.github_repo_name)
  const currentVersion = history.find((v) => v.isCurrent)

  const duplicateVersion = history.some(
    (v) => v.version === version.trim() && (v.status === 'published' || v.status === 'publishing')
  )

  const doPublishUpload = () =>
    new Promise<void>((resolve, reject) => {
      if (!deliverableFile) { reject(new Error('Please attach a .zip or .rar file')); return }
      const formData = new FormData()
      // Non-file fields MUST come before the file field — the server reads
      // them off the multipart stream as it arrives and needs them already
      // populated by the time it reaches the file part (see
      // lib/multipart-stream.ts).
      formData.append('version', version.trim())
      formData.append('releaseNotes', releaseNotes.trim())
      formData.append('notifyBuyers', notifyBuyers ? 'true' : 'false')
      formData.append('deliverableFile', deliverableFile)

      const xhr = new XMLHttpRequest()
      xhr.open('POST', `/api/products/${id}/versions`)
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100))
      }
      xhr.onload = () => {
        let body: { error?: string } | null = null
        try { body = JSON.parse(xhr.responseText) } catch { /* ignore */ }
        if (xhr.status >= 200 && xhr.status < 300) resolve()
        else reject(new Error(body?.error || 'Failed to publish version'))
      }
      xhr.onerror = () => reject(new Error('Failed to publish version'))
      xhr.send(formData)
    })

  const doPublishGithub = async () => {
    const res = await fetch(`/api/products/${id}/versions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        version: version.trim(),
        releaseNotes: releaseNotes.trim(),
        notifyBuyers,
        repoFullName: product.github_repo_name,
        ref: githubRef.trim() || undefined,
      }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to publish version')
  }

  const publish = async () => {
    if (!version.trim()) { toast.error('Enter a version identifier'); return }
    if (duplicateVersion) { toast.error('This version already exists in the marketplace. Please choose a new version number.'); return }

    setSubmitting(true)
    setUploadProgress(0)
    try {
      if (isGithub) await doPublishGithub()
      else await doPublishUpload()

      toast.success(`Version ${version.trim()} published${notifyBuyers ? ' — previous buyers notified' : ''}`)
      setVersion(''); setReleaseNotes(''); setNotifyBuyers(false); setDeliverableFile(null); setGithubRef('')
      setShowConfirm(false)
      await load()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setSubmitting(false)
      setUploadProgress(0)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!product) {
    return <EmptyState icon="AlertCircle" title="Product not found" description="This product doesn't exist or you don't own it." />
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/panel/seller/products" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to My products
      </Link>
      <PageHead
        title={`Versions — ${product.title}`}
        description="Every published version stays downloadable for the buyers who purchased it. Publishing a new version never replaces or deletes an old one."
      />

      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Publish a new version</h3>
          {currentVersion && (
            <span className="text-xs text-muted-foreground">
              Current: <span className="font-mono font-medium text-foreground">v{currentVersion.version}</span>
            </span>
          )}
        </div>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="version">New version identifier</Label>
              <Input id="version" value={version} onChange={(e) => setVersion(e.target.value)} placeholder="1.1.0" />
              {duplicateVersion && (
                <p className="text-xs text-destructive">This version already exists in the marketplace. Please choose a new version number.</p>
              )}
            </div>
            {isGithub ? (
              <div className="space-y-1.5">
                <Label htmlFor="ref">Branch / tag / commit (optional)</Label>
                <Input id="ref" value={githubRef} onChange={(e) => setGithubRef(e.target.value)} placeholder={product.github_default_branch || 'main'} />
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label htmlFor="file">New .zip or .rar file</Label>
                <input
                  id="file"
                  type="file"
                  accept=".zip,.rar"
                  onChange={(e) => setDeliverableFile(e.target.files?.[0] ?? null)}
                  className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-foreground"
                />
                {deliverableFile && <p className="text-xs text-muted-foreground">{deliverableFile.name} · {formatBytes(deliverableFile.size)}</p>}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="releaseNotes">Release notes (optional)</Label>
            <Textarea
              id="releaseNotes"
              value={releaseNotes}
              onChange={(e) => setReleaseNotes(e.target.value)}
              placeholder="What changed in this version?"
              rows={3}
            />
          </div>

          <div className="flex items-start gap-2.5 rounded-lg border border-border bg-muted/30 p-3">
            <Checkbox id="notifyBuyers" checked={notifyBuyers} onCheckedChange={(c) => setNotifyBuyers(c === true)} />
            <Label htmlFor="notifyBuyers" className="cursor-pointer text-sm font-normal leading-snug">
              Notify previous buyers about this new version
              <span className="mt-0.5 block text-xs text-muted-foreground">
                Every buyer with a completed purchase of an earlier version gets an in-app notification once this
                version finishes publishing. Their existing download always keeps returning the version they bought —
                this only tells them a newer one exists.
              </span>
            </Label>
          </div>

          {submitting && !isGithub && (
            <div className="space-y-1.5">
              <Progress value={uploadProgress} />
              <p className="text-xs text-muted-foreground">Uploading… {uploadProgress}%</p>
            </div>
          )}

          <Button onClick={() => setShowConfirm(true)} disabled={submitting || !version.trim()} className="w-full sm:w-auto">
            <Rocket className="size-4" /> Publish new version
          </Button>
        </div>
      </Card>

      {showConfirm && (
        <Card className="border-primary/30 bg-primary/5 p-5">
          <h4 className="text-sm font-semibold">Confirm publication</h4>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            <li>Version: <span className="font-mono font-medium text-foreground">{version.trim()}</span></li>
            <li>Source: {isGithub ? `GitHub (${product.github_repo_name}${githubRef.trim() ? ` @ ${githubRef.trim()}` : ''})` : deliverableFile?.name || 'no file selected'}</li>
            <li>Previous buyers notified: <span className="font-medium text-foreground">{notifyBuyers ? 'Yes' : 'No'}</span></li>
          </ul>
          <div className="mt-4 flex gap-2">
            <Button onClick={publish} loading={submitting} disabled={submitting}>Confirm & publish</Button>
            <Button variant="outline" onClick={() => setShowConfirm(false)} disabled={submitting}>Cancel</Button>
          </div>
        </Card>
      )}

      <Card className="p-5">
        <h3 className="mb-3 text-sm font-semibold">Version history</h3>
        {history.length === 0 ? (
          <EmptyState icon="History" title="No versions yet" description="Publish your first version above." />
        ) : (
          <div className="space-y-3">
            {history.map((v) => (
              <div key={v.id} className="flex items-start justify-between gap-3 rounded-lg border border-border p-3">
                <div className="flex items-start gap-3">
                  {v.deliveryType === 'github' ? <GitBranch className="mt-0.5 size-4 text-muted-foreground" /> : <UploadCloud className="mt-0.5 size-4 text-muted-foreground" />}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold">v{v.version}</span>
                      {v.isCurrent && <Badge variant="success">Current</Badge>}
                      {v.isLegacySnapshot && <Badge variant="muted">Legacy</Badge>}
                    </div>
                    {v.releaseNotes && <p className="mt-1 text-sm text-muted-foreground">{v.releaseNotes}</p>}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {v.deliverableOriginalName || (v.githubCommitSha ? `commit ${v.githubCommitSha.slice(0, 7)}` : '—')}
                      {v.deliverableSizeBytes ? ` · ${formatBytes(v.deliverableSizeBytes)}` : ''}
                      {' · '}
                      {v.publishedAt ? new Date(v.publishedAt).toLocaleDateString() : new Date(v.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Badge variant={statusVariant[v.status]} className="flex items-center gap-1">
                  {v.status === 'published' && <CheckCircle2 className="size-3" />}
                  {v.status === 'failed' && <XCircle className="size-3" />}
                  {v.status === 'publishing' && <Clock className="size-3" />}
                  {v.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
