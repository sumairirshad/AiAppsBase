'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, ArrowRight, Check, ClipboardList, Cpu, Tag, ImageIcon, DollarSign,
  FileArchive, X,
} from 'lucide-react'
import toast from 'react-hot-toast'
import type { AITool, Category, HumanModLevel, LicenseType } from '@/types'

import { cn, formatBytes } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

const STEPS = [
  { label: 'Basic Info', icon: ClipboardList },
  { label: 'AI Disclosure', icon: Cpu },
  { label: 'Media', icon: ImageIcon },
  { label: 'Pricing', icon: DollarSign },
  { label: 'Review', icon: Check },
]

const CATEGORIES: Category[] = [
  'Website Template', 'Landing Page', 'Dashboard', 'E-commerce',
  'SaaS', 'Portfolio', 'Blog', 'Mobile App', 'Component Library', 'Full-Stack App',
]

const AI_TOOL_OPTIONS: AITool[] = [
  'ChatGPT', 'Claude', 'v0', 'Bolt', 'Lovable',
  'Cursor', 'Windsurf', 'Replit', 'Copilot', 'Other',
]

const HUMAN_MOD_LEVELS: HumanModLevel[] = ['Pure AI', 'Lightly Edited', 'Heavily Modified', 'AI-Assisted']
const LICENSE_TYPES: LicenseType[] = ['Personal', 'Commercial', 'Extended Commercial']

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors',
        active
          ? 'border-primary/40 bg-primary/10 text-primary'
          : 'border-border bg-background text-muted-foreground hover:border-primary/30 hover:text-foreground'
      )}
    >
      {children}
    </button>
  )
}

export default function EditProductPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [step, setStep] = useState(0)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<Category | ''>('')
  const [tags, setTags] = useState('')
  const [aiTools, setAiTools] = useState<AITool[]>([])
  const [humanModLevel, setHumanModLevel] = useState<HumanModLevel | ''>('')
  const [previewUrl, setPreviewUrl] = useState('')
  const [price, setPrice] = useState('')
  const [licenseType, setLicenseType] = useState<LicenseType | ''>('')
  const [isGithub, setIsGithub] = useState(false)

  const [deliverableName, setDeliverableName] = useState<string | null>(null)
  const [deliverableSize, setDeliverableSize] = useState<number | null>(null)
  const [replacingFile, setReplacingFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [deletingDeliverable, setDeletingDeliverable] = useState(false)
  const [confirmDeleteDeliverable, setConfirmDeleteDeliverable] = useState(false)

  const loadProduct = async () => {
    try {
      const res = await fetch(`/api/products/${params.id}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load product')

      const p = data.product
      setTitle(p.title ?? '')
      setDescription(p.description ?? '')
      setCategory(p.category ?? '')
      setTags((p.tags ?? []).join(', '))
      setAiTools(p.ai_tools ?? [])
      setHumanModLevel(p.human_mod_level ?? '')
      setPreviewUrl(p.preview_url ?? '')
      setPrice(String(p.price ?? '0'))
      setLicenseType(p.license_type ?? '')
      setIsGithub(Boolean(p.github_repo_name))
      setDeliverableName(p.deliverable_original_name ?? null)
      setDeliverableSize(p.deliverable_size_bytes ?? null)
    } catch (err) {
      toast.error((err as Error).message)
      router.push('/panel/seller/products')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProduct()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  const toggleAiTool = (tool: AITool) =>
    setAiTools((prev) => (prev.includes(tool) ? prev.filter((t) => t !== tool) : [...prev, tool]))

  const handleReplaceFile = async (file: File) => {
    setReplacingFile(file)
    setUploading(true)
    setUploadProgress(0)
    try {
      const formData = new FormData()
      formData.append('deliverableFile', file)

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('POST', `/api/products/${params.id}/deliverable`)
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100))
        }
        xhr.onload = () => {
          let body: { error?: string } | null = null
          try { body = JSON.parse(xhr.responseText) } catch { /* ignore */ }
          if (xhr.status >= 200 && xhr.status < 300) resolve()
          else reject(new Error(body?.error || 'Failed to upload file'))
        }
        xhr.onerror = () => reject(new Error('Failed to upload file'))
        xhr.send(formData)
      })

      toast.success('Deliverable file updated')
      setDeliverableName(file.name)
      setDeliverableSize(file.size)
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setUploading(false)
      setUploadProgress(0)
      setReplacingFile(null)
    }
  }

  const handleDeleteDeliverable = async () => {
    setDeletingDeliverable(true)
    try {
      const res = await fetch(`/api/products/${params.id}/deliverable`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to delete file')
      setDeliverableName(null)
      setDeliverableSize(null)
      toast.success('Deliverable file removed')
      setConfirmDeleteDeliverable(false)
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setDeletingDeliverable(false)
    }
  }

  const handleSave = async () => {
    if (!title.trim() || !category || !licenseType) {
      toast.error('Please fill in title, category and license type')
      setStep(0)
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/products/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          category,
          tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
          aiTools,
          humanModLevel,
          previewUrl,
          price: parseFloat(price) || 0,
          licenseType,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save changes')

      toast.success('Product updated')
      router.push('/panel/seller/products')
      router.refresh()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 py-2">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl py-2">
      <Link
        href="/panel/seller/products"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to products
      </Link>

      <h1 className="mb-6 font-display text-2xl font-bold tracking-tight sm:text-3xl">Edit product</h1>

      {/* Stepper */}
      <div className="mb-10 flex items-center justify-between">
        {STEPS.map((s, i) => (
          <div key={s.label} className="flex flex-1 items-center last:flex-initial">
            <button type="button" onClick={() => setStep(i)} className="flex flex-col items-center">
              <div
                className={cn(
                  'grid size-10 place-items-center rounded-full text-sm font-semibold transition-colors',
                  i < step ? 'bg-primary text-primary-foreground'
                    : i === step ? 'border-2 border-primary bg-primary/15 text-primary'
                    : 'border border-border bg-muted text-muted-foreground'
                )}
              >
                {i < step ? <Check className="size-4" /> : <s.icon className="size-4" />}
              </div>
              <span className={cn('mt-2 hidden text-xs sm:block', i <= step ? 'font-medium text-primary' : 'text-muted-foreground')}>
                {s.label}
              </span>
            </button>
            {i < STEPS.length - 1 && (
              <div className={cn('mx-2 h-0.5 flex-1 rounded-full', i < step ? 'bg-primary' : 'bg-border')} />
            )}
          </div>
        ))}
      </div>

      <Card className="mb-8 p-6 sm:p-8">
        {step === 0 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Basic information</h2>
            <div className="space-y-2">
              <Label htmlFor="title">Product title</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="desc">Description</Label>
              <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={5} />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
                <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
                <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <Input id="tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="dashboard, analytics, saas" />
              <p className="text-xs text-muted-foreground">Separate tags with commas</p>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">AI disclosure</h2>
            <div className="space-y-3">
              <Label>AI tools used</Label>
              <div className="flex flex-wrap gap-2">
                {AI_TOOL_OPTIONS.map((tool) => (
                  <Chip key={tool} active={aiTools.includes(tool)} onClick={() => toggleAiTool(tool)}>{tool}</Chip>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Human modification level</Label>
              <Select value={humanModLevel} onValueChange={(v) => setHumanModLevel(v as HumanModLevel)}>
                <SelectTrigger><SelectValue placeholder="Select modification level" /></SelectTrigger>
                <SelectContent>{HUMAN_MOD_LEVELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Media & deliverable</h2>
            <div className="space-y-2">
              <Label htmlFor="preview">Live preview URL</Label>
              <Input id="preview" type="url" value={previewUrl} onChange={(e) => setPreviewUrl(e.target.value)} placeholder="https://example.com/preview" />
            </div>

            {isGithub ? (
              <p className="rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
                This is a GitHub-based listing — buyers download the linked repository directly, so there's no uploaded file to manage here.
              </p>
            ) : (
              <div className="space-y-3">
                <Label>Product deliverable (.zip or .rar)</Label>

                {deliverableName && !uploading && (
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/40 p-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <FileArchive className="size-5 shrink-0 text-primary" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{deliverableName}</p>
                        {deliverableSize != null && (
                          <p className="text-xs text-muted-foreground">{formatBytes(deliverableSize)}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <label className="cursor-pointer">
                          Replace
                          <input
                            type="file"
                            accept=".zip,.rar"
                            className="hidden"
                            onChange={(e) => e.target.files?.[0] && handleReplaceFile(e.target.files[0])}
                          />
                        </label>
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setConfirmDeleteDeliverable(true)}>
                        <X className="size-4" /> Delete
                      </Button>
                    </div>
                  </div>
                )}

                {!deliverableName && !uploading && (
                  <div className="relative rounded-xl border-2 border-dashed border-border p-8 text-center transition-colors hover:border-primary/40">
                    <input
                      type="file"
                      accept=".zip,.rar"
                      onChange={(e) => e.target.files?.[0] && handleReplaceFile(e.target.files[0])}
                      className="absolute inset-0 size-full cursor-pointer opacity-0"
                    />
                    <FileArchive className="mx-auto mb-3 size-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">No deliverable uploaded — click to add one</p>
                  </div>
                )}

                {uploading && (
                  <div className="space-y-1.5 rounded-xl border border-border bg-muted/40 p-4">
                    <p className="truncate text-sm font-medium">{replacingFile?.name}</p>
                    <Progress value={uploadProgress} />
                    <p className="text-xs text-muted-foreground">Uploading… {uploadProgress}%</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Pricing & license</h2>
            <div className="space-y-2">
              <Label htmlFor="price">Price (USD)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="pl-9" min="0" step="0.01" />
              </div>
              <p className="text-xs text-muted-foreground">Set to 0 for a free product.</p>
            </div>
            <div className="space-y-2">
              <Label>License type</Label>
              <Select value={licenseType} onValueChange={(v) => setLicenseType(v as LicenseType)}>
                <SelectTrigger><SelectValue placeholder="Select license type" /></SelectTrigger>
                <SelectContent>{LICENSE_TYPES.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold">Review & save</h2>
              <p className="mt-1 text-sm text-muted-foreground">Review your changes before saving.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { label: 'Title', value: title },
                { label: 'Category', value: category },
                { label: 'Price', value: price ? `$${parseFloat(price).toFixed(2)}` : '' },
                { label: 'License', value: licenseType },
                { label: 'Human modification', value: humanModLevel },
                { label: 'Deliverable', value: isGithub ? 'GitHub repository' : deliverableName },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-lg border border-border bg-muted/40 p-4">
                  <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
                  <div className="mt-1 text-sm">{value || <span className="italic text-muted-foreground">Not set</span>}</div>
                </div>
              ))}
            </div>
            <div className="rounded-lg border border-border bg-muted/40 p-4">
              <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">AI tools</div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {aiTools.length > 0 ? aiTools.map((t) => <Badge key={t} variant="brand">{t}</Badge>) : <span className="text-sm italic text-muted-foreground">None</span>}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Saving changes to an already-approved product sends it back for admin re-review before it's visible to buyers again.
            </p>
          </div>
        )}
      </Card>

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
          <ArrowLeft className="size-4" /> Previous
        </Button>
        {step < STEPS.length - 1 ? (
          <Button variant="gradient" onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}>
            Next <ArrowRight className="size-4" />
          </Button>
        ) : (
          <Button variant="gradient" onClick={handleSave} loading={saving} disabled={saving}>
            <Check className="size-4" /> Save changes
          </Button>
        )}
      </div>

      <ConfirmDialog
        open={confirmDeleteDeliverable}
        onOpenChange={setConfirmDeleteDeliverable}
        title="Delete deliverable file?"
        description="Buyers won't be able to download this product until you upload a new file."
        confirmLabel="Delete"
        destructive
        loading={deletingDeliverable}
        onConfirm={handleDeleteDeliverable}
      />
    </div>
  )
}
