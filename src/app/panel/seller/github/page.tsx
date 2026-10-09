'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Github, Star, GitFork, ExternalLink, RefreshCw,
  Package, AlertCircle, Unlink, Clock,
  Check, DollarSign, PlusCircle,
} from 'lucide-react'
import toast from 'react-hot-toast'

import { timeAgo } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHead } from '@/components/dashboard/page-head'
import { EmptyState } from '@/components/dashboard/empty-state'

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
    <div className="mx-auto max-w-6xl">
      <div className="mb-8 flex items-center justify-between gap-4">
        <PageHead
          title="GitHub repos"
          description={
            <>
              Connect GitHub to browse your public repositories. Sell any repo directly from the{' '}
              <Link href="/panel/seller/add-product?mode=github" className="text-primary hover:underline">
                Add Product
              </Link>{' '}
              page.
            </>
          }
        />
        <div className="flex shrink-0 items-center gap-3">
          {connected && (
            <Button variant="outline" onClick={fetchRepos} disabled={loading}>
              <RefreshCw className={loading ? 'size-4 animate-spin' : 'size-4'} />
              Refresh
            </Button>
          )}
          <Button variant="gradient" asChild>
            <Link href="/panel/seller/add-product?mode=github"><PlusCircle className="size-4" /> Sell a Repo</Link>
          </Button>
        </div>
      </div>

      <Card className="mb-8 p-6">
        {loading ? (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Skeleton className="size-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-28" />
              </div>
            </div>
            <Skeleton className="h-9 w-32 rounded-lg" />
          </div>
        ) : connected ? (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="size-12 overflow-hidden rounded-full bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://github.com/${githubUsername}.png?size=48`}
                  alt={githubUsername ?? ''}
                  className="size-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-success" />
                  <span className="font-semibold">{githubUsername}</span>
                  <span className="text-sm text-muted-foreground">GitHub connected</span>
                </div>
                <p className="mt-0.5 text-sm text-muted-foreground">{repos.length} public repos</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" asChild>
                <a href="/api/auth/github"><Github className="size-4" /> Reconnect</a>
              </Button>
              <Button
                variant="outline"
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="text-destructive hover:bg-destructive/10"
              >
                <Unlink className="size-4" />
                {disconnecting ? 'Disconnecting...' : 'Disconnect'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center py-6 text-center">
            <div className="mb-4 grid size-16 place-items-center rounded-2xl bg-muted">
              <Github className="size-8 text-muted-foreground" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">Connect your GitHub account</h3>
            <p className="mb-6 max-w-md text-sm text-muted-foreground">
              Link your GitHub to browse and sell your public repositories on the marketplace.
            </p>
            <Button variant="default" className="bg-[#24292f] text-white hover:bg-[#32383f]" asChild>
              <a href="/api/auth/github"><Github className="size-4" /> Connect GitHub</a>
            </Button>
          </div>
        )}
      </Card>

      {connected && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-primary" />
          <p className="text-sm text-primary">
            To sell a repo, click <strong>Sell This Repo</strong> below — it will take you to the product listing form where you can set price, category, and license.
          </p>
        </div>
      )}

      {connected && !loading && (
        <>
          <div className="mb-5 flex items-center gap-4">
            <Input
              type="text"
              placeholder="Search repositories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
            <p className="ml-auto text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{filtered.length}</span> repos
            </p>
          </div>

          {filtered.length === 0 ? (
            <EmptyState icon="Package" title="No repositories found" description="Try a different search term." />
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((repo) => {
                const isListed = listedRepoNames.has(repo.fullName)
                const langColor = repo.language ? (LANG_COLORS[repo.language] ?? '#8b949e') : null

                return (
                  <Card key={repo.id} interactive className="flex flex-col gap-3 p-5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <a
                          href={repo.htmlUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex items-center gap-1.5 text-sm font-semibold transition-colors hover:text-primary"
                        >
                          {repo.name}
                          <ExternalLink className="size-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
                        </a>
                        <p className="mt-0.5 text-xs text-muted-foreground">{repo.fullName}</p>
                      </div>
                      {isListed && (
                        <Badge variant="success" className="shrink-0">
                          <Check className="size-3" /> Listed
                        </Badge>
                      )}
                    </div>

                    {repo.description && (
                      <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                        {repo.description}
                      </p>
                    )}

                    {repo.topics.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {repo.topics.slice(0, 4).map((topic) => (
                          <Badge key={topic} variant="brand">{topic}</Badge>
                        ))}
                      </div>
                    )}

                    <div className="mt-auto flex items-center gap-4 text-xs text-muted-foreground">
                      {langColor && (
                        <span className="flex items-center gap-1.5">
                          <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: langColor }} />
                          {repo.language}
                        </span>
                      )}
                      <span className="flex items-center gap-1"><Star className="size-3" /> {repo.stars}</span>
                      <span className="flex items-center gap-1"><GitFork className="size-3" /> {repo.forks}</span>
                      <span className="ml-auto flex items-center gap-1"><Clock className="size-3" /> {timeAgo(repo.updatedAt)}</span>
                    </div>

                    {isListed ? (
                      <Button disabled variant="outline" className="w-full">
                        <Check className="size-4" /> Already Listed
                      </Button>
                    ) : (
                      <Button variant="gradient" className="w-full" asChild>
                        <Link href={`/panel/seller/add-product?mode=github&repo=${encodeURIComponent(repo.fullName)}`}>
                          <DollarSign className="size-4" /> Sell This Repo
                        </Link>
                      </Button>
                    )}
                  </Card>
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
