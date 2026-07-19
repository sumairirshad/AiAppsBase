'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowLeft, ArrowRight, Check, Upload, Tag, Cpu, Image as ImageIcon, DollarSign,
  ClipboardList, Github, Star, Search, Loader2, ExternalLink,
  RefreshCw, AlertCircle, Zap, FileArchive, X,
} from 'lucide-react'
import type { AITool, Category, TechStack, HumanModLevel, LicenseType } from '@/types'
import toast from 'react-hot-toast'

import { cn, formatBytes } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

const MANUAL_STEPS = [
  { label: 'Basic Info', icon: ClipboardList },
  { label: 'AI Disclosure', icon: Cpu },
  { label: 'Tech Details', icon: Tag },
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

const TECH_STACK_OPTIONS: TechStack[] = [
  'React', 'Next.js', 'Vue', 'Svelte', 'HTML/CSS',
  'React Native', 'Flutter', 'Swift', 'Kotlin', 'Tailwind CSS',
]

const HUMAN_MOD_LEVELS: HumanModLevel[] = ['Pure AI', 'Lightly Edited', 'Heavily Modified', 'AI-Assisted']
const LICENSE_TYPES: LicenseType[] = ['Personal', 'Commercial', 'Extended Commercial']

const LANG_COLORS: Record<string, string> = {
  JavaScript: '#f1e05a', TypeScript: '#3178c6', Python: '#3572A5',
  Rust: '#dea584', Go: '#00ADD8', Java: '#b07219', Ruby: '#701516',
  Swift: '#F05138', Kotlin: '#A97BFF', Dart: '#00B4AB', PHP: '#4F5D95',
  Vue: '#41b883', CSS: '#563d7c', HTML: '#e34c26', Shell: '#89e051',
  'C++': '#f34b7d', C: '#555555',
}

interface GithubRepo {
  id: number
  name: string
  fullName: string
  description: string | null
  language: string | null
  stars: number
  forks: number
  updatedAt: string
  defaultBranch: string
  htmlUrl: string
  topics: string[]
}

/* Reusable chip toggle */
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

function AddProductContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [mode, setMode] = useState<'manual' | 'github'>(
    searchParams.get('mode') === 'github' ? 'github' : 'manual'
  )

  const [step, setStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<Category | ''>('')
  const [tags, setTags] = useState('')
  const [aiTools, setAiTools] = useState<AITool[]>([])
  const [humanModLevel, setHumanModLevel] = useState<HumanModLevel | ''>('')
  const [framework, setFramework] = useState('')
  const [techStack, setTechStack] = useState<TechStack[]>([])
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [previewUrl, setPreviewUrl] = useState('')
  const [price, setPrice] = useState('')
  const [licenseType, setLicenseType] = useState<LicenseType | ''>('')
  const [deliverableFile, setDeliverableFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const [ghLoading, setGhLoading] = useState(false)
  const [ghConnected, setGhConnected] = useState(false)
  const [ghUsername, setGhUsername] = useState<string | null>(null)
  const [ghRepos, setGhRepos] = useState<GithubRepo[]>([])
  const [ghListedNames, setGhListedNames] = useState<Set<string>>(new Set())
  const [ghSearch, setGhSearch] = useState('')
  const [ghSelectedRepo, setGhSelectedRepo] = useState<GithubRepo | null>(null)
  const [ghTitle, setGhTitle] = useState('')
  const [ghDescription, setGhDescription] = useState('')
  const [ghCategory, setGhCategory] = useState<Category | ''>('')
  const [ghAiTools, setGhAiTools] = useState<AITool[]>([])
  const [ghHumanModLevel, setGhHumanModLevel] = useState<HumanModLevel>('Heavily Modified')
  const [ghPrice, setGhPrice] = useState('')
  const [ghLicenseType, setGhLicenseType] = useState<LicenseType | ''>('')
  const [ghSubmitting, setGhSubmitting] = useState(false)

  const selectRepo = useCallback((repo: GithubRepo) => {
    setGhSelectedRepo(repo)
    setGhTitle(repo.name.replace(/[-_]/g, ' '))
    setGhDescription(repo.description ?? '')
  }, [])

  const fetchGithubData = useCallback(async () => {
    setGhLoading(true)
    try {
      const res = await fetch('/api/seller/github/repos')
      const data = await res.json()
      setGhConnected(data.connected ?? false)
      setGhUsername(data.githubUsername ?? null)
      const repos: GithubRepo[] = data.repos ?? []
      setGhRepos(repos)
      setGhListedNames(new Set(data.listedRepoNames ?? []))

      const repoParam = searchParams.get('repo')
      if (repoParam) {
        const found = repos.find((r) => r.fullName === repoParam)
        if (found) selectRepo(found)
      }
    } catch {
      /* silent */
    } finally {
      setGhLoading(false)
    }
  }, [searchParams, selectRepo])

  useEffect(() => {
    if (mode === 'github') fetchGithubData()
  }, [mode, fetchGithubData])

  const toggleAiTool = (tool: AITool) =>
    setAiTools((p) => (p.includes(tool) ? p.filter((t) => t !== tool) : [...p, tool]))
  const toggleTechStack = (tech: TechStack) =>
    setTechStack((p) => (p.includes(tech) ? p.filter((t) => t !== tech) : [...p, tech]))
  const toggleGhAiTool = (tool: AITool) =>
    setGhAiTools((p) => (p.includes(tool) ? p.filter((t) => t !== tool) : [...p, tool]))

  const handleManualSubmit = async () => {
    if (!title.trim() || !category || !licenseType) {
      toast.error('Please fill in title, category and license type')
      return
    }
    if (!deliverableFile) {
      toast.error('Please upload a .zip or .rar file with your product')
      return
    }

    const formData = new FormData()
    formData.append('title', title)
    formData.append('description', description)
    formData.append('category', category)
    formData.append('tags', JSON.stringify(tags.split(',').map((t) => t.trim()).filter(Boolean)))
    formData.append('aiTools', JSON.stringify(aiTools))
    formData.append('humanModLevel', humanModLevel)
    formData.append('framework', framework)
    formData.append('techStack', JSON.stringify(techStack))
    formData.append('previewUrl', previewUrl)
    formData.append('price', price)
    formData.append('licenseType', licenseType)
    selectedFiles.forEach((file) => formData.append('screenshotFiles', file))
    formData.append('deliverableFile', deliverableFile)

    setIsSubmitting(true)
    setUploading(true)
    setUploadProgress(0)
    try {
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('POST', '/api/products')
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setUploadProgress(Math.round((e.loaded / e.total) * 100))
          }
        }
        xhr.onload = () => {
          let body: { id?: string; error?: string } | null = null
          try {
            body = JSON.parse(xhr.responseText)
          } catch {
            /* ignore */
          }
          if (xhr.status >= 200 && xhr.status < 300 && body) {
            resolve()
          } else {
            reject(new Error(body?.error || 'Failed to add product'))
          }
        }
        xhr.onerror = () => reject(new Error('Failed to add product'))
        xhr.send(formData)
      })

      toast.success('Product submitted successfully!')
      router.push('/panel/seller/products')
      router.refresh()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setIsSubmitting(false)
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const handleGhSubmit = async () => {
    if (!ghSelectedRepo) { toast.error('Please select a repository'); return }
    if (!ghTitle.trim() || !ghCategory || !ghLicenseType) {
      toast.error('Please fill in title, category and license type')
      return
    }

    setGhSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('title', ghTitle.trim())
      formData.append('description', ghDescription.trim() || `Source code — ${ghSelectedRepo.name}`)
      formData.append('category', ghCategory)
      formData.append('price', ghPrice || '0')
      formData.append('licenseType', ghLicenseType)
      formData.append('humanModLevel', ghHumanModLevel)
      formData.append('aiTools', JSON.stringify(ghAiTools))
      formData.append('techStack', JSON.stringify(ghSelectedRepo.language ? [ghSelectedRepo.language] : []))
      formData.append('tags', JSON.stringify(ghSelectedRepo.topics.slice(0, 10)))
      formData.append('previewUrl', ghSelectedRepo.htmlUrl)
      formData.append('githubRepoName', ghSelectedRepo.fullName)
      formData.append('githubDefaultBranch', ghSelectedRepo.defaultBranch)

      const res = await fetch('/api/products', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to list product')

      toast.success('Repo listed! It will go live after admin approval.')
      router.push('/panel/seller/products')
      router.refresh()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setGhSubmitting(false)
    }
  }

  const ghFiltered = ghRepos.filter(
    (r) =>
      ghSearch === '' ||
      r.name.toLowerCase().includes(ghSearch.toLowerCase()) ||
      (r.description ?? '').toLowerCase().includes(ghSearch.toLowerCase()) ||
      (r.language ?? '').toLowerCase().includes(ghSearch.toLowerCase())
  )

  return (
    <div className="mx-auto max-w-4xl py-2">
      <Link
        href="/panel/seller/products"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to products
      </Link>

      <h1 className="mb-6 font-display text-2xl font-bold tracking-tight sm:text-3xl">Add new product</h1>

      {/* Mode toggle */}
      <div className="mb-8 inline-flex gap-1 rounded-xl border border-border bg-muted/40 p-1">
        <button
          onClick={() => setMode('manual')}
          className={cn(
            'inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-all',
            mode === 'manual' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Upload className="size-4" /> Upload manually
        </button>
        <button
          onClick={() => setMode('github')}
          className={cn(
            'inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-all',
            mode === 'github' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Github className="size-4" /> Sell GitHub repo
        </button>
      </div>

      {mode === 'manual' && (
        <>
          {/* Stepper */}
          <div className="mb-10 flex items-center justify-between">
            {MANUAL_STEPS.map((s, i) => (
              <div key={s.label} className="flex flex-1 items-center last:flex-initial">
                <div className="flex flex-col items-center">
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
                </div>
                {i < MANUAL_STEPS.length - 1 && (
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
                  <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. SaaS Dashboard Pro" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="desc">Description</Label>
                  <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={5} placeholder="Describe your product in detail…" />
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
                <div>
                  <h2 className="text-xl font-semibold">AI disclosure</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Transparency builds trust. Let buyers know which AI tools were used.</p>
                </div>
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
                <h2 className="text-xl font-semibold">Technical details</h2>
                <div className="space-y-2">
                  <Label htmlFor="fw">Primary framework</Label>
                  <Input id="fw" value={framework} onChange={(e) => setFramework(e.target.value)} placeholder="e.g. Next.js 14" />
                </div>
                <div className="space-y-3">
                  <Label>Tech stack</Label>
                  <div className="flex flex-wrap gap-2">
                    {TECH_STACK_OPTIONS.map((tech) => (
                      <Chip key={tech} active={techStack.includes(tech)} onClick={() => toggleTechStack(tech)}>{tech}</Chip>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold">Media & screenshots</h2>
                <div className="space-y-2">
                  <Label htmlFor="preview">Live preview URL</Label>
                  <Input id="preview" type="url" value={previewUrl} onChange={(e) => setPreviewUrl(e.target.value)} placeholder="https://example.com/preview" />
                </div>
                <div className="space-y-3">
                  <Label>Upload screenshots</Label>
                  <div className="relative rounded-xl border-2 border-dashed border-border p-8 text-center transition-colors hover:border-primary/40">
                    <input type="file" multiple accept="image/*" onChange={(e) => e.target.files && setSelectedFiles(Array.from(e.target.files))} className="absolute inset-0 size-full cursor-pointer opacity-0" />
                    <Upload className="mx-auto mb-3 size-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">{selectedFiles.length > 0 ? `${selectedFiles.length} files selected` : 'Drag & drop or click to upload'}</p>
                    <p className="mt-1 text-xs text-muted-foreground">PNG, JPG up to 5MB each</p>
                  </div>
                  {selectedFiles.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedFiles.map((f, i) => (
                        <Badge key={i} variant="secondary" className="font-normal">{f.name}</Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  <Label>Product deliverable (.zip or .rar) <span className="text-destructive">*</span></Label>
                  {!deliverableFile ? (
                    <div className="relative rounded-xl border-2 border-dashed border-border p-8 text-center transition-colors hover:border-primary/40">
                      <input
                        type="file"
                        accept=".zip,.rar,application/zip,application/x-zip-compressed,application/vnd.rar,application/x-rar-compressible"
                        onChange={(e) => setDeliverableFile(e.target.files?.[0] ?? null)}
                        className="absolute inset-0 size-full cursor-pointer opacity-0"
                      />
                      <FileArchive className="mx-auto mb-3 size-8 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Drag & drop or click to upload the file buyers will download</p>
                      <p className="mt-1 text-xs text-muted-foreground">.zip or .rar — no size limit</p>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/40 p-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <FileArchive className="size-5 shrink-0 text-primary" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{deliverableFile.name}</p>
                          <p className="text-xs text-muted-foreground">{formatBytes(deliverableFile.size)}</p>
                        </div>
                      </div>
                      {!uploading && (
                        <button type="button" onClick={() => setDeliverableFile(null)} className="shrink-0 text-muted-foreground hover:text-foreground" aria-label="Remove file">
                          <X className="size-4" />
                        </button>
                      )}
                    </div>
                  )}
                  {uploading && (
                    <div className="space-y-1.5">
                      <Progress value={uploadProgress} />
                      <p className="text-xs text-muted-foreground">Uploading… {uploadProgress}%</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold">Pricing & license</h2>
                <div className="space-y-2">
                  <Label htmlFor="price">Price (USD)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="pl-9" placeholder="0.00" min="0" step="0.01" />
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

            {step === 5 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold">Review & submit</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Review your product details before submitting.</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    { label: 'Title', value: title },
                    { label: 'Category', value: category },
                    { label: 'Price', value: price ? `$${parseFloat(price).toFixed(2)}` : '' },
                    { label: 'License', value: licenseType },
                    { label: 'Human modification', value: humanModLevel },
                    { label: 'Framework', value: framework },
                    { label: 'Deliverable', value: deliverableFile?.name },
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
              </div>
            )}
          </Card>

          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0 || isSubmitting}>
              <ArrowLeft className="size-4" /> Previous
            </Button>
            {step < MANUAL_STEPS.length - 1 ? (
              <Button variant="gradient" onClick={() => setStep((s) => Math.min(MANUAL_STEPS.length - 1, s + 1))}>
                Next <ArrowRight className="size-4" />
              </Button>
            ) : (
              <Button variant="gradient" onClick={handleManualSubmit} loading={isSubmitting} disabled={isSubmitting}>
                <Check className="size-4" /> {uploading ? `Uploading… ${uploadProgress}%` : 'Submit for review'}
              </Button>
            )}
          </div>
        </>
      )}

      {mode === 'github' && (
        <div className="space-y-6">
          <Card className="p-5">
            {ghLoading ? (
              <div className="flex items-center gap-3 text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                <span className="text-sm">Checking GitHub connection…</span>
              </div>
            ) : ghConnected ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="size-9 overflow-hidden rounded-full bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`https://github.com/${ghUsername}.png?size=36`} alt="" className="size-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="size-2 rounded-full bg-success" />
                      <span className="text-sm font-medium">{ghUsername}</span>
                      <span className="text-xs text-muted-foreground">GitHub connected</span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{ghRepos.length} public repos available</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={fetchGithubData} disabled={ghLoading} aria-label="Refresh">
                    <RefreshCw className={cn('size-4', ghLoading && 'animate-spin')} />
                  </Button>
                  <Button variant="outline" size="sm" asChild><a href="/api/auth/github">Reconnect</a></Button>
                  <Button variant="outline" size="sm" asChild><Link href="/panel/seller/github"><Github className="size-3.5" /> Browse all repos</Link></Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 py-2 sm:flex-row">
                <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-muted">
                  <Github className="size-6 text-muted-foreground" />
                </div>
                <div className="text-center sm:text-left">
                  <p className="text-sm font-medium">Connect your GitHub account</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">Link GitHub to browse and sell your public repositories.</p>
                </div>
                <Button className="shrink-0 sm:ml-auto" asChild><a href="/api/auth/github"><Github className="size-4" /> Connect GitHub</a></Button>
              </div>
            )}
          </Card>

          {ghConnected && (
            <>
              <Card className="p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-semibold">
                    1. Select repository
                    {ghSelectedRepo && <Badge variant="success" className="ml-2">Selected</Badge>}
                  </h2>
                  <span className="text-xs text-muted-foreground">{ghFiltered.length} repos</span>
                </div>

                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Search repositories…" value={ghSearch} onChange={(e) => setGhSearch(e.target.value)} className="pl-9" />
                </div>

                <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                  {ghFiltered.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">No repositories found.</p>
                  ) : (
                    ghFiltered.map((repo) => {
                      const isSelected = ghSelectedRepo?.fullName === repo.fullName
                      const isListed = ghListedNames.has(repo.fullName)
                      const langColor = repo.language ? (LANG_COLORS[repo.language] ?? '#8b949e') : null

                      return (
                        <button
                          key={repo.id}
                          onClick={() => !isListed && selectRepo(repo)}
                          disabled={isListed}
                          className={cn(
                            'w-full rounded-xl border p-3.5 text-left transition-all',
                            isSelected ? 'border-primary/60 bg-primary/10'
                              : isListed ? 'cursor-not-allowed border-border bg-muted/40 opacity-60'
                              : 'border-border bg-background hover:border-primary/40 hover:bg-accent'
                          )}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-2">
                              <span className={cn('grid size-4 shrink-0 place-items-center rounded-full border-2', isSelected ? 'border-primary bg-primary' : 'border-muted-foreground/40')}>
                                {isSelected && <span className="size-1.5 rounded-full bg-primary-foreground" />}
                              </span>
                              <span className="truncate text-sm font-medium">{repo.name}</span>
                              {isListed && <Badge variant="success" className="shrink-0">Listed</Badge>}
                            </div>
                            <div className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
                              {langColor && (
                                <span className="flex items-center gap-1">
                                  <span className="size-2.5 rounded-full" style={{ backgroundColor: langColor }} /> {repo.language}
                                </span>
                              )}
                              <span className="flex items-center gap-1"><Star className="size-3" /> {repo.stars}</span>
                              <a href={repo.htmlUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="hover:text-foreground">
                                <ExternalLink className="size-3.5" />
                              </a>
                            </div>
                          </div>
                          {repo.description && <p className="ml-6 mt-1.5 line-clamp-1 text-xs text-muted-foreground">{repo.description}</p>}
                          {repo.topics.length > 0 && (
                            <div className="ml-6 mt-2 flex flex-wrap gap-1">
                              {repo.topics.slice(0, 4).map((t) => <Badge key={t} variant="muted" className="text-[10px]">{t}</Badge>)}
                            </div>
                          )}
                        </button>
                      )
                    })
                  )}
                </div>
              </Card>

              <Card className={cn('p-5 transition-opacity', ghSelectedRepo ? 'opacity-100' : 'pointer-events-none opacity-50')}>
                <h2 className="mb-5 font-semibold">2. Product details</h2>

                {!ghSelectedRepo && (
                  <div className="mb-4 flex items-center gap-2 rounded-lg border border-border bg-muted/40 p-3">
                    <AlertCircle className="size-4 shrink-0 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Select a repository above to fill in product details.</p>
                  </div>
                )}

                {ghSelectedRepo && (
                  <div className="mb-5 flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
                    <Github className="size-4 shrink-0 text-primary" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{ghSelectedRepo.fullName}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">Branch: {ghSelectedRepo.defaultBranch} · Buyers download this repo as a ZIP</p>
                    </div>
                  </div>
                )}

                <div className="space-y-5">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label>Product title <span className="text-destructive">*</span></Label>
                      <Input value={ghTitle} onChange={(e) => setGhTitle(e.target.value)} placeholder="Enter product title" />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label>Description</Label>
                      <Textarea value={ghDescription} onChange={(e) => setGhDescription(e.target.value)} rows={3} placeholder="Describe what buyers get…" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Category <span className="text-destructive">*</span></Label>
                      <Select value={ghCategory} onValueChange={(v) => setGhCategory(v as Category)}>
                        <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                        <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>License type <span className="text-destructive">*</span></Label>
                      <Select value={ghLicenseType} onValueChange={(v) => setGhLicenseType(v as LicenseType)}>
                        <SelectTrigger><SelectValue placeholder="Select license" /></SelectTrigger>
                        <SelectContent>{LICENSE_TYPES.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Price (USD)</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input type="number" value={ghPrice} onChange={(e) => setGhPrice(e.target.value)} className="pl-9" placeholder="0.00" min="0" step="0.01" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Human modification level</Label>
                      <Select value={ghHumanModLevel} onValueChange={(v) => setGhHumanModLevel(v as HumanModLevel)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{HUMAN_MOD_LEVELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>AI tools used <span className="font-normal text-muted-foreground">(optional)</span></Label>
                    <div className="flex flex-wrap gap-2">
                      {AI_TOOL_OPTIONS.map((tool) => (
                        <Chip key={tool} active={ghAiTools.includes(tool)} onClick={() => toggleGhAiTool(tool)}>{tool}</Chip>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Zap className="size-3.5" /> Product goes live after admin approval
                </div>
                <Button variant="gradient" onClick={handleGhSubmit} disabled={!ghSelectedRepo} loading={ghSubmitting}>
                  <Check className="size-4" /> Submit for review
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default function AddProductPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-4xl py-8"><Skeleton className="h-8 w-48" /></div>}>
      <AddProductContent />
    </Suspense>
  )
}
