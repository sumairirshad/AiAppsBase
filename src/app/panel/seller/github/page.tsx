'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Github, Star, GitFork, ExternalLink, RefreshCw,
  Loader2, Package, AlertCircle, Unlink, Clock,
  Check, DollarSign, PlusCircle,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { timeAgo } from '@/lib/utils'

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

function GithubReposContent() {
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [connected, setConnected] = useState(false)
  const [githubUsername, setGithubUsername] = useState<string | null>(null)
  const [repos, setRepos] = useState<GithubRepo[]>([])
  const [listedRepoNames, setListedRepoNames] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [disconnecting, setDisconnecting] = useState(false)

  const fetchRepos = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/seller/github/repos')
      const data = await res.json()
      setConnected(data.connected ?? false)
      setGithubUsername(data.githubUsername ?? null)
      setRepos(data.repos ?? [])
      setListedRepoNames(new Set(data.listedRepoNames ?? []))
    } catch {
      toast.error('Failed to load GitHub data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRepos()
    if (searchParams.get('connected') === '1') toast.success('GitHub connected successfully!')
    if (searchParams.get('error')) toast.error('GitHub connection failed. Please try again.')
  }, [fetchRepos, searchParams])

  const handleDisconnect = async () => {
    if (!confirm('Disconnect GitHub? Your listed products will remain, but you won\'t be able to list new repos.')) return
    setDisconnecting(true)
    try {
      await fetch('/api/seller/github/disconnect', { method: 'DELETE' })
      setConnected(false)
      setGithubUsername(null)
      setRepos([])
      toast.success('GitHub disconnected')
    } catch {
      toast.error('Failed to disconnect')
    } finally {
      setDisconnecting(false)
    }
  }

  const filtered = repos.filter(
    (r) =>
      search === '' ||
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      (r.description ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (r.language ?? '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1 flex items-center gap-3">
            <Github className="w-8 h-8" />
            GitHub Repos
          </h1>
          <p className="text-surface-400 text-sm">
            Connect GitHub to browse your public repositories. Sell any repo directly from the{' '}
            <Link href="/panel/seller/add-product?mode=github" className="text-brand-400 hover:text-brand-300">
              Add Product
            </Link>{' '}
            page.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {connected && (
            <button onClick={fetchRepos} disabled={loading} className="btn-secondary flex items-center gap-2 text-sm">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          )}
          <Link href="/panel/seller/add-product?mode=github" className="btn-primary flex items-center gap-2 text-sm">
            <PlusCircle className="w-4 h-4" />
            Sell a Repo
          </Link>
        </div>
      </div>

      <div className="glass rounded-xl p-6 mb-8">
        {loading ? (
          <div className="flex items-center gap-3 text-surface-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Loading GitHub status...</span>
          </div>
        ) : connected ? (
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-surface-700 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://github.com/${githubUsername}.png?size=48`}
                  alt={githubUsername ?? ''}
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                  <span className="text-white font-semibold">{githubUsername}</span>
                  <span className="text-surface-500 text-sm">GitHub connected</span>
                </div>
                <p className="text-surface-400 text-sm mt-0.5">{repos.length} public repos</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <a href="/api/auth/github" className="btn-secondary text-sm flex items-center gap-2">
                <Github className="w-4 h-4" />
                Reconnect
              </a>
              <button
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-red-400 border border-red-500/30 hover:bg-red-500/10 transition-colors disabled:opacity-50"
              >
                <Unlink className="w-4 h-4" />
                {disconnecting ? 'Disconnecting...' : 'Disconnect'}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center py-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-surface-800 flex items-center justify-center mb-4">
              <Github className="w-8 h-8 text-surface-400" />
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">Connect your GitHub account</h3>
            <p className="text-surface-400 text-sm mb-6 max-w-md">
              Link your GitHub to browse and sell your public repositories on the marketplace.
            </p>
            <a
              href="/api/auth/github"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#24292f] hover:bg-[#32383f] text-white font-medium rounded-xl transition-colors border border-white/10"
            >
              <Github className="w-5 h-5" />
              Connect GitHub
            </a>
          </div>
        )}
      </div>

      {connected && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-brand-500/5 border border-brand-500/20 mb-6">
          <AlertCircle className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
          <p className="text-brand-300 text-sm">
            To sell a repo, click <strong>Sell This Repo</strong> below — it will take you to the product listing form where you can set price, category, and license.
          </p>
        </div>
      )}

      {connected && !loading && (
        <>
          <div className="flex items-center gap-4 mb-5">
            <div className="relative flex-1 max-w-sm">
              <input
                type="text"
                placeholder="Search repositories..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field pl-4 pr-4 w-full"
              />
            </div>
            <p className="text-surface-500 text-sm ml-auto">
              <span className="text-white font-medium">{filtered.length}</span> repos
            </p>
          </div>

          {filtered.length === 0 ? (
            <div className="glass rounded-xl p-12 text-center">
              <Package className="w-12 h-12 text-surface-600 mx-auto mb-4" />
              <p className="text-surface-400">No repositories found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((repo) => {
                const isListed = listedRepoNames.has(repo.fullName)
                const langColor = repo.language ? (LANG_COLORS[repo.language] ?? '#8b949e') : null

                return (
                  <div
                    key={repo.id}
                    className="glass rounded-xl p-5 flex flex-col gap-3 border border-white/5 hover:border-white/10 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <a
                          href={repo.htmlUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-white font-semibold text-sm hover:text-brand-400 transition-colors flex items-center gap-1.5 group"
                        >
                          {repo.name}
                          <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                        </a>
                        <p className="text-xs text-surface-500 mt-0.5">{repo.fullName}</p>
                      </div>
                      {isListed && (
                        <span className="flex items-center gap-1 text-[10px] font-medium text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-1 rounded-full shrink-0">
                          <Check className="w-3 h-3" />
                          Listed
                        </span>
                      )}
                    </div>

                    {repo.description && (
                      <p className="text-surface-400 text-xs leading-relaxed line-clamp-2">
                        {repo.description}
                      </p>
                    )}

                    {repo.topics.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {repo.topics.slice(0, 4).map((topic) => (
                          <span key={topic} className="text-[10px] px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20">
                            {topic}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-surface-500 text-xs mt-auto">
                      {langColor && (
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: langColor }} />
                          {repo.language}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3" /> {repo.stars}
                      </span>
                      <span className="flex items-center gap-1">
                        <GitFork className="w-3 h-3" /> {repo.forks}
                      </span>
                      <span className="flex items-center gap-1 ml-auto">
                        <Clock className="w-3 h-3" /> {timeAgo(repo.updatedAt)}
                      </span>
                    </div>

                    {isListed ? (
                      <button disabled className="w-full py-2 rounded-lg text-sm font-medium bg-surface-800/50 text-surface-600 cursor-not-allowed flex items-center justify-center gap-2">
                        <Check className="w-4 h-4" />
                        Already Listed
                      </button>
                    ) : (
                      <Link
                        href={`/panel/seller/add-product?mode=github&repo=${encodeURIComponent(repo.fullName)}`}
                        className="w-full py-2 rounded-lg text-sm font-medium btn-primary flex items-center justify-center gap-2"
                      >
                        <DollarSign className="w-4 h-4" />
                        Sell This Repo
                      </Link>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default function GithubReposPage() {
  return (
    <Suspense>
      <GithubReposContent />
    </Suspense>
  )
}
