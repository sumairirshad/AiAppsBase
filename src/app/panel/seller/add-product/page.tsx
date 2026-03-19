'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Check, Upload, Tag, Cpu, Image, DollarSign, ClipboardList } from 'lucide-react'
import { AITool, Category, TechStack, HumanModLevel, LicenseType } from '@/types'
import toast from 'react-hot-toast'

const STEPS = [
  { label: 'Basic Info', icon: ClipboardList },
  { label: 'AI Disclosure', icon: Cpu },
  { label: 'Tech Details', icon: Tag },
  { label: 'Media', icon: Image },
  { label: 'Pricing', icon: DollarSign },
  { label: 'Review', icon: Check },
]

const categories: Category[] = [
  'Website Template', 'Landing Page', 'Dashboard', 'E-commerce',
  'SaaS', 'Portfolio', 'Blog', 'Mobile App', 'Component Library', 'Full-Stack App',
]

const aiToolOptions: AITool[] = [
  'ChatGPT', 'Claude', 'v0', 'Bolt', 'Lovable',
  'Cursor', 'Windsurf', 'Replit', 'Copilot', 'Other',
]

const techStackOptions: TechStack[] = [
  'React', 'Next.js', 'Vue', 'Svelte', 'HTML/CSS',
  'React Native', 'Flutter', 'Swift', 'Kotlin', 'Tailwind CSS',
]

const humanModLevels: HumanModLevel[] = ['Pure AI', 'Lightly Edited', 'Heavily Modified', 'AI-Assisted']

const licenseTypes: LicenseType[] = ['Personal', 'Commercial', 'Extended Commercial']

export default function AddProductPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Step 1: Basic Info
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<Category | ''>('')
  const [tags, setTags] = useState('')

  // Step 2: AI Disclosure
  const [aiTools, setAiTools] = useState<AITool[]>([])
  const [humanModLevel, setHumanModLevel] = useState<HumanModLevel | ''>('')

  // Step 3: Tech Details
  const [framework, setFramework] = useState('')
  const [techStack, setTechStack] = useState<TechStack[]>([])

  // Step 4: Media
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [previewUrl, setPreviewUrl] = useState('')

  // Step 5: Pricing
  const [price, setPrice] = useState('')
  const [licenseType, setLicenseType] = useState<LicenseType | ''>('')

  const toggleAiTool = (tool: AITool) => {
    setAiTools((prev) =>
      prev.includes(tool) ? prev.filter((t) => t !== tool) : [...prev, tool]
    )
  }

  const toggleTechStack = (tech: TechStack) => {
    setTechStack((prev) =>
      prev.includes(tech) ? prev.filter((t) => t !== tech) : [...prev, tech]
    )
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files))
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('title', title)
      formData.append('description', description)
      formData.append('category', category)
      formData.append('tags', JSON.stringify(tags.split(',').map(t => t.trim()).filter(t => t)))
      formData.append('aiTools', JSON.stringify(aiTools))
      formData.append('humanModLevel', humanModLevel)
      formData.append('framework', framework)
      formData.append('techStack', JSON.stringify(techStack))
      formData.append('previewUrl', previewUrl)
      formData.append('price', price)
      formData.append('licenseType', licenseType)
      
      selectedFiles.forEach((file) => {
        formData.append('screenshotFiles', file)
      })

      const response = await fetch('/api/products', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to add product')

      toast.success('Product submitted successfully!')
      router.push('/panel/seller/products')
      router.refresh()
    } catch (error) {
      toast.error((error as Error).message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-4">
      {/* Back link */}
      <Link
        href="/panel/seller/products"
        className="inline-flex items-center gap-2 text-surface-400 hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Products
      </Link>

      <h1 className="text-3xl font-bold text-white mb-8">Add New Product</h1>

      {/* Step Progress Indicator */}
      <div className="flex items-center justify-between mb-10">
        {STEPS.map((s, i) => (
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
            {i < STEPS.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-2 ${
                  i < step ? 'bg-brand-500' : 'bg-surface-700'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="glass rounded-xl p-6 sm:p-8 mb-8">
        {/* Step 1: Basic Info */}
        {step === 0 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white mb-4">Basic Information</h2>

            <div>
              <label className="block text-sm font-medium text-surface-300 mb-2">Product Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input-field w-full"
                placeholder="e.g. SaaS Dashboard Pro"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-300 mb-2">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input-field w-full min-h-[120px] resize-y"
                placeholder="Describe your product in detail..."
                rows={4}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-300 mb-2">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="input-field w-full"
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-300 mb-2">Tags</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="input-field w-full"
                placeholder="Comma-separated tags, e.g. dashboard, analytics, saas"
              />
              <p className="text-xs text-surface-500 mt-1">Separate tags with commas</p>
            </div>
          </div>
        )}

        {/* Step 2: AI Disclosure */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white mb-4">AI Disclosure</h2>
            <p className="text-surface-400 text-sm mb-6">
              Transparency builds trust. Let buyers know which AI tools were used and how much human modification was applied.
            </p>

            <div>
              <label className="block text-sm font-medium text-surface-300 mb-3">AI Tools Used</label>
              <div className="flex flex-wrap gap-2">
                {aiToolOptions.map((tool) => (
                  <button
                    key={tool}
                    type="button"
                    onClick={() => toggleAiTool(tool)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      aiTools.includes(tool)
                        ? 'bg-brand-500/20 text-brand-400 border-brand-500/40'
                        : 'bg-surface-800/50 text-surface-400 border-surface-700 hover:border-surface-600'
                    }`}
                  >
                    {tool}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-300 mb-2">Human Modification Level</label>
              <select
                value={humanModLevel}
                onChange={(e) => setHumanModLevel(e.target.value as HumanModLevel)}
                className="input-field w-full"
              >
                <option value="">Select modification level</option>
                {humanModLevels.map((level) => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Step 3: Tech Details */}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white mb-4">Technical Details</h2>

            <div>
              <label className="block text-sm font-medium text-surface-300 mb-2">Primary Framework</label>
              <input
                type="text"
                value={framework}
                onChange={(e) => setFramework(e.target.value)}
                className="input-field w-full"
                placeholder="e.g. Next.js 14"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-300 mb-3">Tech Stack</label>
              <div className="flex flex-wrap gap-2">
                {techStackOptions.map((tech) => (
                  <button
                    key={tech}
                    type="button"
                    onClick={() => toggleTechStack(tech)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      techStack.includes(tech)
                        ? 'bg-brand-500/20 text-brand-400 border-brand-500/40'
                        : 'bg-surface-800/50 text-surface-400 border-surface-700 hover:border-surface-600'
                    }`}
                  >
                    {tech}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Media */}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white mb-4">Media & Screenshots</h2>

            <div>
              <label className="block text-sm font-medium text-surface-300 mb-2">Live Preview URL</label>
              <input
                type="url"
                value={previewUrl}
                onChange={(e) => setPreviewUrl(e.target.value)}
                className="input-field w-full"
                placeholder="https://example.com/preview"
              />
              <p className="text-xs text-surface-500 mt-1">Optional. Link to a live demo of your product.</p>
            </div>

            {/* Upload */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-surface-300">Upload Screenshots</label>
              <div className="border-2 border-dashed border-surface-700 rounded-xl p-8 text-center hover:border-surface-600 transition-colors relative">
                <input 
                  type="file" 
                  multiple 
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Upload className="w-8 h-8 text-surface-500 mx-auto mb-3" />
                <p className="text-surface-400 text-sm">
                  {selectedFiles.length > 0 
                    ? `${selectedFiles.length} files selected` 
                    : 'Drag & drop files here or click to upload'}
                </p>
                <p className="text-surface-500 text-xs mt-1">PNG, JPG up to 5MB each</p>
              </div>
              
              {selectedFiles.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedFiles.map((file, i) => (
                    <div key={i} className="text-xs bg-white/5 border border-white/10 px-2 py-1 rounded text-surface-400">
                      {file.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 5: Pricing */}
        {step === 4 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white mb-4">Pricing & License</h2>

            <div>
              <label className="block text-sm font-medium text-surface-300 mb-2">Price (USD)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="input-field w-full pl-9"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
              <p className="text-xs text-surface-500 mt-1">Set to 0 for a free product.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-300 mb-2">License Type</label>
              <select
                value={licenseType}
                onChange={(e) => setLicenseType(e.target.value as LicenseType)}
                className="input-field w-full"
              >
                <option value="">Select license type</option>
                {licenseTypes.map((lt) => (
                  <option key={lt} value={lt}>{lt}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Step 6: Review & Submit */}
        {step === 5 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white mb-4">Review & Submit</h2>
            <p className="text-surface-400 text-sm mb-6">Review your product details before submitting for approval.</p>

            <div className="space-y-4">
              <div className="rounded-lg bg-white/5 p-4">
                <h3 className="text-xs font-medium text-surface-500 uppercase tracking-wider mb-1">Title</h3>
                <p className="text-white">{title || <span className="text-surface-600 italic">Not set</span>}</p>
              </div>

              <div className="rounded-lg bg-white/5 p-4">
                <h3 className="text-xs font-medium text-surface-500 uppercase tracking-wider mb-1">Description</h3>
                <p className="text-surface-300 text-sm">{description || <span className="text-surface-600 italic">Not set</span>}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-white/5 p-4">
                  <h3 className="text-xs font-medium text-surface-500 uppercase tracking-wider mb-1">Category</h3>
                  <p className="text-white">{category || <span className="text-surface-600 italic">Not set</span>}</p>
                </div>
                <div className="rounded-lg bg-white/5 p-4">
                  <h3 className="text-xs font-medium text-surface-500 uppercase tracking-wider mb-1">Tags</h3>
                  <p className="text-surface-300 text-sm">{tags || <span className="text-surface-600 italic">Not set</span>}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-white/5 p-4">
                  <h3 className="text-xs font-medium text-surface-500 uppercase tracking-wider mb-1">AI Tools</h3>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {aiTools.length > 0 ? aiTools.map((tool) => (
                      <span key={tool} className="badge bg-brand-500/20 text-brand-400 border border-brand-500/30">{tool}</span>
                    )) : <span className="text-surface-600 italic text-sm">None selected</span>}
                  </div>
                </div>
                <div className="rounded-lg bg-white/5 p-4">
                  <h3 className="text-xs font-medium text-surface-500 uppercase tracking-wider mb-1">Human Modification</h3>
                  <p className="text-white">{humanModLevel || <span className="text-surface-600 italic">Not set</span>}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-white/5 p-4">
                  <h3 className="text-xs font-medium text-surface-500 uppercase tracking-wider mb-1">Framework</h3>
                  <p className="text-white">{framework || <span className="text-surface-600 italic">Not set</span>}</p>
                </div>
                <div className="rounded-lg bg-white/5 p-4">
                  <h3 className="text-xs font-medium text-surface-500 uppercase tracking-wider mb-1">Tech Stack</h3>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {techStack.length > 0 ? techStack.map((tech) => (
                      <span key={tech} className="badge bg-surface-700 text-surface-300">{tech}</span>
                    )) : <span className="text-surface-600 italic text-sm">None selected</span>}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-white/5 p-4">
                  <h3 className="text-xs font-medium text-surface-500 uppercase tracking-wider mb-1">Price</h3>
                  <p className="text-white text-lg font-semibold">
                    {price ? `$${parseFloat(price).toFixed(2)}` : <span className="text-surface-600 italic text-sm font-normal">Not set</span>}
                  </p>
                </div>
                <div className="rounded-lg bg-white/5 p-4">
                  <h3 className="text-xs font-medium text-surface-500 uppercase tracking-wider mb-1">License</h3>
                  <p className="text-white">{licenseType || <span className="text-surface-600 italic">Not set</span>}</p>
                </div>
              </div>

              <div className="rounded-lg bg-white/5 p-4">
                <h3 className="text-xs font-medium text-surface-500 uppercase tracking-wider mb-1">Preview URL</h3>
                <p className="text-brand-400 text-sm">{previewUrl || <span className="text-surface-600 italic">Not set</span>}</p>
              </div>

              <div className="rounded-lg bg-white/5 p-4">
                <h3 className="text-xs font-medium text-surface-500 uppercase tracking-wider mb-1">Screenshots</h3>
                <p className="text-white text-sm">{selectedFiles.length > 0 ? `${selectedFiles.length} files selected` : 'None'}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0 || isSubmitting}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-colors ${
            step === 0 || isSubmitting
              ? 'text-surface-600 cursor-not-allowed'
              : 'text-surface-300 hover:text-white bg-surface-800/50 hover:bg-surface-700'
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          Previous
        </button>

        {step < STEPS.length - 1 ? (
          <button
            onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
            className="btn-primary flex items-center gap-2"
          >
            Next
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="btn-primary flex items-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              'Submitting...'
            ) : (
              <>
                <Check className="w-4 h-4" />
                Submit for Review
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
