'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowLeft, ArrowRight, Check, Upload, Tag, Cpu, Image, DollarSign,
  ClipboardList, Github, Star, GitFork, Search, Loader2, ExternalLink,
  RefreshCw, AlertCircle, Zap,
} from 'lucide-react'
import type { AITool, Category, TechStack, HumanModLevel, LicenseType } from '@/types'
import toast from 'react-hot-toast'

const MANUAL_STEPS = [
  { label: 'Basic Info', icon: ClipboardList },
  { label: 'AI Disclosure', icon: Cpu },
  { label: 'Tech Details', icon: Tag },
  { label: 'Media', icon: Image },
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
  }, [searchParams])

  useEffect(() => {
    if (mode === 'github') fetchGithubData()
  }, [mode, fetchGithubData])

  const selectRepo = (repo: GithubRepo) => {
    setGhSelectedRepo(repo)
    setGhTitle(repo.name.replace(/[-_]/g, ' '))
    setGhDescription(repo.description ?? '')
  }

  const toggleAiTool = (tool: AITool) =>
    setAiTools((p) => (p.includes(tool) ? p.filter((t) => t !== tool) : [...p, tool]))
  const toggleTechStack = (tech: TechStack) =>
    setTechStack((p) => (p.includes(tech) ? p.filter((t) => t !== tech) : [...p, tech]))
  const toggleGhAiTool = (tool: AITool) =>
    setGhAiTools((p) => (p.includes(tool) ? p.filter((t) => t !== tool) : [...p, tool]))

  const handleManualSubmit = async () => {
    setIsSubmitting(true)
    try {
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

      const res = await fetch('/api/products', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to add product')

      toast.success('Product submitted successfully!')
      router.push('/panel/seller/products')
      router.refresh()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setIsSubmitting(false)
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
    <div className="max-w-4xl mx-auto py-4">
      <Link
        href="/panel/seller/products"
        className="inline-flex items-center gap-2 text-surface-400 hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Products
      </Link>

      <h1 className="text-3xl font-bold text-white mb-6">Add New Product</h1>

      <div className="flex gap-1 p-1 bg-surface-800/50 rounded-xl border border-white/5 mb-8 w-fit">
        <button
          onClick={() => setMode('manual')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
            mode === 'manual'
              ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20'
              : 'text-surface-400 hover:text-white'
          }`}
        >
          <Upload className="w-4 h-4" />
          Upload Manually
        </button>
        <button
          onClick={() => setMode('github')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
            mode === 'github'
              ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20'
              : 'text-surface-400 hover:text-white'
          }`}
        >
          <Github className="w-4 h-4" />
          Sell GitHub Repo
        </button>
      </div>

      {mode === 'manual' && (
        <>
          <div className="flex items-center justify-between mb-10">
            {MANUAL_STEPS.map((s, i) => (
              <div key={s.label} className="flex items-center flex-1 last:flex-initial">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                      i < step
                        ? 'bg-brand-500 text-white'
                        : i === step
                        ? 'bg-brand-500/20 text-brand-400 border-2 border-brand-500'
                        : 'bg-surface-800 text-surface-500 border border-surface-700'
                    }`}
                  >
                    {i < step ? <Check className="w-4 h-4" /> : <s.icon className="w-4 h-4" />}
                  </div>
                  <span
                    className={`text-xs mt-2 hidden sm:block ${
                      i <= step ? 'text-brand-400' : 'text-surface-500'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {i < MANUAL_STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 ${i < step ? 'bg-brand-500' : 'bg-surface-700'}`} />
                )}
              </div>
            ))}
          </div>

          <div className="glass rounded-xl p-6 sm:p-8 mb-8">
            {step === 0 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-white mb-4">Basic Information</h2>
                <div>
                  <label className="block text-sm font-medium text-surface-300 mb-2">Product Title</label>
                  <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="input-field w-full" placeholder="e.g. SaaS Dashboard Pro" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-300 mb-2">Description</label>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="input-field w-full min-h-[120px] resize-y" placeholder="Describe your product in detail..." rows={4} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-300 mb-2">Category</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value as Category)} className="input-field w-full">
                    <option value="">Select a category</option>
                    {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-300 mb-2">Tags</label>
                  <input type="text" value={tags} onChange={(e) => setTags(e.target.value)} className="input-field w-full" placeholder="dashboard, analytics, saas" />
                  <p className="text-xs text-surface-500 mt-1">Separate tags with commas</p>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-white mb-4">AI Disclosure</h2>
                <p className="text-surface-400 text-sm mb-6">Transparency builds trust. Let buyers know which AI tools were used.</p>
                <div>
                  <label className="block text-sm font-medium text-surface-300 mb-3">AI Tools Used</label>
                  <div className="flex flex-wrap gap-2">
                    {AI_TOOL_OPTIONS.map((tool) => (
                      <button key={tool} type="button" onClick={() => toggleAiTool(tool)} className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${aiTools.includes(tool) ? 'bg-brand-500/20 text-brand-400 border-brand-500/40' : 'bg-surface-800/50 text-surface-400 border-surface-700 hover:border-surface-600'}`}>
                        {tool}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-300 mb-2">Human Modification Level</label>
                  <select value={humanModLevel} onChange={(e) => setHumanModLevel(e.target.value as HumanModLevel)} className="input-field w-full">
                    <option value="">Select modification level</option>
                    {HUMAN_MOD_LEVELS.map((level) => <option key={level} value={level}>{level}</option>)}
                  </select>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-white mb-4">Technical Details</h2>
                <div>
                  <label className="block text-sm font-medium text-surface-300 mb-2">Primary Framework</label>
                  <input type="text" value={framework} onChange={(e) => setFramework(e.target.value)} className="input-field w-full" placeholder="e.g. Next.js 14" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-300 mb-3">Tech Stack</label>
                  <div className="flex flex-wrap gap-2">
                    {TECH_STACK_OPTIONS.map((tech) => (
                      <button key={tech} type="button" onClick={() => toggleTechStack(tech)} className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${techStack.includes(tech) ? 'bg-brand-500/20 text-brand-400 border-brand-500/40' : 'bg-surface-800/50 text-surface-400 border-surface-700 hover:border-surface-600'}`}>
                        {tech}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-white mb-4">Media & Screenshots</h2>
                <div>
                  <label className="block text-sm font-medium text-surface-300 mb-2">Live Preview URL</label>
                  <input type="url" value={previewUrl} onChange={(e) => setPreviewUrl(e.target.value)} className="input-field w-full" placeholder="https://example.com/preview" />
                </div>
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-surface-300">Upload Screenshots</label>
                  <div className="border-2 border-dashed border-surface-700 rounded-xl p-8 text-center hover:border-surface-600 transition-colors relative">
                    <input type="file" multiple accept="image/*" onChange={(e) => e.target.files && setSelectedFiles(Array.from(e.target.files))} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    <Upload className="w-8 h-8 text-surface-500 mx-auto mb-3" />
                    <p className="text-surface-400 text-sm">{selectedFiles.length > 0 ? `${selectedFiles.length} files selected` : 'Drag & drop or click to upload'}</p>
                    <p className="text-surface-500 text-xs mt-1">PNG, JPG up to 5MB each</p>
                  </div>
                  {selectedFiles.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedFiles.map((f, i) => (
                        <div key={i} className="text-xs bg-white/5 border border-white/10 px-2 py-1 rounded text-surface-400">{f.name}</div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-white mb-4">Pricing & License</h2>
                <div>
                  <label className="block text-sm font-medium text-surface-300 mb-2">Price (USD)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
                    <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="input-field w-full pl-9" placeholder="0.00" min="0" step="0.01" />
                  </div>
                  <p className="text-xs text-surface-500 mt-1">Set to 0 for a free product.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-300 mb-2">License Type</label>
                  <select value={licenseType} onChange={(e) => setLicenseType(e.target.value as LicenseType)} className="input-field w-full">
                    <option value="">Select license type</option>
                    {LICENSE_TYPES.map((lt) => <option key={lt} value={lt}>{lt}</option>)}
                  </select>
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-white mb-4">Review & Submit</h2>
                <p className="text-surface-400 text-sm mb-6">Review your product details before submitting.</p>
                <div className="space-y-4">
                  {[
                    { label: 'Title', value: title },
                    { label: 'Category', value: category },
                    { label: 'Price', value: price ? `$${parseFloat(price).toFixed(2)}` : '' },
                    { label: 'License', value: licenseType },
                    { label: 'Human Modification', value: humanModLevel },
                  ].map(({ label, value }) => (
                    <div key={label} className="rounded-lg bg-white/5 p-4">
                      <h3 className="text-xs font-medium text-surface-500 uppercase tracking-wider mb-1">{label}</h3>
                      <p className="text-white">{value || <span className="text-surface-600 italic">Not set</span>}</p>
                    </div>
                  ))}
                  <div className="rounded-lg bg-white/5 p-4">
                    <h3 className="text-xs font-medium text-surface-500 uppercase tracking-wider mb-1">AI Tools</h3>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {aiTools.length > 0 ? aiTools.map((t) => <span key={t} className="badge bg-brand-500/20 text-brand-400 border border-brand-500/30">{t}</span>) : <span className="text-surface-600 italic text-sm">None</span>}
                    </div>
                  </div>
                  <div className="rounded-lg bg-white/5 p-4">
                    <h3 className="text-xs font-medium text-surface-500 uppercase tracking-wider mb-1">Screenshots</h3>
                    <p className="text-white text-sm">{selectedFiles.length > 0 ? `${selectedFiles.length} files` : 'None'}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <button onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0 || isSubmitting} className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-colors ${step === 0 || isSubmitting ? 'text-surface-600 cursor-not-allowed' : 'text-surface-300 hover:text-white bg-surface-800/50 hover:bg-surface-700'}`}>
              <ArrowLeft className="w-4 h-4" /> Previous
            </button>
            {step < MANUAL_STEPS.length - 1 ? (
              <button onClick={() => setStep((s) => Math.min(MANUAL_STEPS.length - 1, s + 1))} className="btn-primary flex items-center gap-2">
                Next <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={handleManualSubmit} disabled={isSubmitting} className="btn-primary flex items-center gap-2 disabled:opacity-50">
                {isSubmitting ? 'Submitting...' : <><Check className="w-4 h-4" /> Submit for Review</>}
              </button>
            )}
          </div>
        </>
      )}

      {mode === 'github' && (
        <div className="space-y-6">

          <div className="glass rounded-xl p-5">
            {ghLoading ? (
              <div className="flex items-center gap-3 text-surface-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Checking GitHub connection...</span>
              </div>
            ) : ghConnected ? (
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-surface-700 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`https://github.com/${ghUsername}.png?size=36`} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-400" />
                      <span className="text-white text-sm font-medium">{ghUsername}</span>
                      <span className="text-surface-500 text-xs">GitHub connected</span>
                    </div>
                    <p className="text-surface-500 text-xs mt-0.5">{ghRepos.length} public repos available</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={fetchGithubData} disabled={ghLoading} className="text-surface-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/5">
                    <RefreshCw className={`w-4 h-4 ${ghLoading ? 'animate-spin' : ''}`} />
                  </button>
                  <a href="/api/auth/github" className="text-xs text-surface-400 hover:text-white border border-surface-700 hover:border-surface-600 px-3 py-1.5 rounded-lg transition-colors">
                    Reconnect
                  </a>
                  <Link href="/panel/seller/github" className="text-xs text-brand-400 hover:text-brand-300 border border-brand-500/30 hover:border-brand-500/50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5">
                    <Github className="w-3.5 h-3.5" />
                    Browse All Repos
                  </Link>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-4 py-2">
                <div className="w-12 h-12 rounded-xl bg-surface-800 flex items-center justify-center shrink-0">
                  <Github className="w-6 h-6 text-surface-400" />
                </div>
                <div className="text-center sm:text-left">
                  <p className="text-white font-medium text-sm">Connect your GitHub account</p>
                  <p className="text-surface-400 text-xs mt-0.5">Link GitHub to browse and sell your public repositories.</p>
                </div>
                <a href="/api/auth/github" className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 bg-[#24292f] hover:bg-[#32383f] text-white text-sm font-medium rounded-xl transition-colors border border-white/10">
                  <Github className="w-4 h-4" />
                  Connect GitHub
                </a>
              </div>
            )}
          </div>

          {ghConnected && (
            <>
              <div className="glass rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-white font-semibold">
                    1. Select Repository
                    {ghSelectedRepo && (
                      <span className="ml-2 text-xs font-normal text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full">
                        ✓ Selected
                      </span>
                    )}
                  </h2>
                  <span className="text-surface-500 text-xs">{ghFiltered.length} repos</span>
                </div>

                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
                  <input
                    type="text"
                    placeholder="Search repositories..."
                    value={ghSearch}
                    onChange={(e) => setGhSearch(e.target.value)}
                    className="input-field pl-9 w-full"
                  />
                </div>

                <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                  {ghFiltered.length === 0 ? (
                    <p className="text-surface-500 text-sm text-center py-6">No repositories found.</p>
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
                          className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                            isSelected
                              ? 'border-brand-500/60 bg-brand-500/10'
                              : isListed
                              ? 'border-surface-700/50 bg-surface-800/30 opacity-60 cursor-not-allowed'
                              : 'border-surface-700/50 bg-surface-800/30 hover:border-surface-600 hover:bg-surface-700/30 cursor-pointer'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${isSelected ? 'border-brand-500 bg-brand-500' : 'border-surface-600'}`}>
                                {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                              </div>
                              <span className="text-white text-sm font-medium truncate">{repo.name}</span>
                              {isListed && <span className="text-[10px] text-green-400 bg-green-500/10 border border-green-500/20 px-1.5 py-0.5 rounded-full shrink-0">Listed</span>}
                            </div>
                            <div className="flex items-center gap-3 text-surface-500 text-xs shrink-0">
                              {langColor && (
                                <span className="flex items-center gap-1">
                                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: langColor }} />
                                  {repo.language}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Star className="w-3 h-3" /> {repo.stars}
                              </span>
                              <a href={repo.htmlUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="hover:text-white transition-colors">
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          </div>
                          {repo.description && (
                            <p className="text-surface-400 text-xs mt-1.5 ml-6 line-clamp-1">{repo.description}</p>
                          )}
                          {repo.topics.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2 ml-6">
                              {repo.topics.slice(0, 4).map((t) => (
                                <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-full bg-surface-700 text-surface-400">{t}</span>
                              ))}
                            </div>
                          )}
                        </button>
                      )
                    })
                  )}
                </div>
              </div>

              <div className={`glass rounded-xl p-5 transition-opacity ${ghSelectedRepo ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                <h2 className="text-white font-semibold mb-5">2. Product Details</h2>

                {!ghSelectedRepo && (
                  <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-surface-800/50 border border-surface-700">
                    <AlertCircle className="w-4 h-4 text-surface-500 shrink-0" />
                    <p className="text-surface-400 text-xs">Select a repository above to fill in product details.</p>
                  </div>
                )}

                {ghSelectedRepo && (
                  <div className="flex items-center gap-3 mb-5 p-3 rounded-lg bg-brand-500/5 border border-brand-500/20">
                    <Github className="w-4 h-4 text-brand-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium">{ghSelectedRepo.fullName}</p>
                      <p className="text-surface-400 text-xs mt-0.5">Branch: {ghSelectedRepo.defaultBranch} · Buyers will download this repo as a ZIP</p>
                    </div>
                  </div>
                )}

                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-surface-300 mb-1.5">
                        Product Title <span className="text-red-400">*</span>
                      </label>
                      <input type="text" value={ghTitle} onChange={(e) => setGhTitle(e.target.value)} className="input-field w-full" placeholder="Enter product title" />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-surface-300 mb-1.5">Description</label>
                      <textarea value={ghDescription} onChange={(e) => setGhDescription(e.target.value)} className="input-field w-full min-h-[90px] resize-y" placeholder="Describe what buyers get..." rows={3} />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-surface-300 mb-1.5">
                        Category <span className="text-red-400">*</span>
                      </label>
                      <select value={ghCategory} onChange={(e) => setGhCategory(e.target.value as Category)} className="input-field w-full">
                        <option value="">Select category</option>
                        {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-surface-300 mb-1.5">
                        License Type <span className="text-red-400">*</span>
                      </label>
                      <select value={ghLicenseType} onChange={(e) => setGhLicenseType(e.target.value as LicenseType)} className="input-field w-full">
                        <option value="">Select license</option>
                        {LICENSE_TYPES.map((l) => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-surface-300 mb-1.5">Price (USD)</label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
                        <input type="number" value={ghPrice} onChange={(e) => setGhPrice(e.target.value)} className="input-field w-full pl-9" placeholder="0.00" min="0" step="0.01" />
                      </div>
                      <p className="text-xs text-surface-500 mt-1">Leave empty or 0 for free.</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-surface-300 mb-1.5">Human Modification Level</label>
                      <select value={ghHumanModLevel} onChange={(e) => setGhHumanModLevel(e.target.value as HumanModLevel)} className="input-field w-full">
                        {HUMAN_MOD_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-surface-300 mb-2">
                      AI Tools Used <span className="text-surface-500 font-normal">(optional)</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {AI_TOOL_OPTIONS.map((tool) => (
                        <button key={tool} type="button" onClick={() => toggleGhAiTool(tool)} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${ghAiTools.includes(tool) ? 'bg-brand-500/20 text-brand-400 border-brand-500/40' : 'bg-surface-800/50 text-surface-400 border-surface-700 hover:border-surface-600'}`}>
                          {tool}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-surface-500 mt-1.5">Select any AI tools that helped create this code.</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2 text-surface-500 text-xs">
                  <Zap className="w-3.5 h-3.5" />
                  Product goes live after admin approval
                </div>
                <button
                  onClick={handleGhSubmit}
                  disabled={ghSubmitting || !ghSelectedRepo}
                  className="btn-primary flex items-center gap-2 disabled:opacity-50"
                >
                  {ghSubmitting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
                  ) : (
                    <><Check className="w-4 h-4" /> Submit for Review</>
                  )}
                </button>
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
    <Suspense>
      <AddProductContent />
    </Suspense>
  )
}
