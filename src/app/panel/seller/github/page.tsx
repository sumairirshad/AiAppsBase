'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Github, Star, GitFork, ExternalLink, RefreshCw,
  AlertCircle, Unlink, Clock, Lock,
  Check, DollarSign, PlusCircle, ArrowLeftRight,
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
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'

const LANG_COLORS: Record<string, string> = {
  JavaScript: '#f1e05a', TypeScript: '#3178c6', Python: '#3572A5',
  Rust: '#dea584', Go: '#00ADD8', Java: '#b07219', Ruby: '#701516',
  Swift: '#F05138', Kotlin: '#A97BFF', Dart: '#00B4AB', PHP: '#4F5D95',
  Vue: '#41b883', CSS: '#563d7c', HTML: '#e34c26', Shell: '#89e051',
  'C++': '#f34b7d', C: '#555555',
}

interface GithubRepo {
  id: number | string
  name: string
  fullName: string
  description: string | null
  language: string | null
  stars: number
  forks: number
  updatedAt: string | null
  defaultBranch: string
  htmlUrl: string
  topics: string[]
  private: boolean
  unavailable?: boolean
}

function RepoMeta({ repo }: { repo: GithubRepo }) {
  const langColor = repo.language ? (LANG_COLORS[repo.language] ?? '#8b949e') : null
  return (
    <div className="mt-auto flex items-center gap-4 text-xs text-muted-foreground">
      {langColor && (
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: langColor }} />
          {repo.language}
        </span>
      )}
      <span className="flex items-center gap-1"><Star className="size-3" /> {repo.stars}</span>
      <span className="flex items-center gap-1"><GitFork className="size-3" /> {repo.forks}</span>
      {repo.updatedAt && (
        <span className="ml-auto flex items-center gap-1"><Clock className="size-3" /> {timeAgo(repo.updatedAt)}</span>
      )}
    </div>
  )
}

function GithubReposContent() {
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [connected, setConnected] = useState(false)
  const [githubUsername, setGithubUsername] = useState<string | null>(null)
  const [repos, setRepos] = useState<GithubRepo[]>([])
  const [listedRepoNames, setListedRepoNames] = useState<Set<string>>(new Set())
  const [selectedRepo, setSelectedRepo] = useState<GithubRepo | null>(null)
  const [search, setSearch] = useState('')
  const [disconnecting, setDisconnecting] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [selecting, setSelecting] = useState<string | null>(null)

  const fetchRepos = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/seller/github/repos')
      const data = await res.json()
      setConnected(data.connected ?? false)
      setGithubUsername(data.githubUsername ?? null)
      setRepos(data.repos ?? [])
      setListedRepoNames(new Set(data.listedRepoNames ?? []))
      setSelectedRepo(data.selectedRepo ?? null)
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

  // Open the repo picker right after connecting, and also whenever a
  // connected seller has no repo selected yet — never dump the full list
  // on the page itself.
  useEffect(() => {
    if (loading || !connected) return
    const justConnected = searchParams.get('connected') === '1'
    if (justConnected || !selectedRepo) setPickerOpen(true)
  }, [loading, connected, selectedRepo, searchParams])

  const handleDisconnect = async () => {
    if (!confirm('Disconnect GitHub? Your listed products will remain, but you won\'t be able to list new repos.')) return
    setDisconnecting(true)
    try {
      await fetch('/api/seller/github/disconnect', { method: 'DELETE' })
      setConnected(false)
      setGithubUsername(null)
      setRepos([])
      setSelectedRepo(null)
      toast.success('GitHub disconnected')
    } catch {
      toast.error('Failed to disconnect')
    } finally {
      setDisconnecting(false)
    }
  }

  const handleSelectRepo = async (repo: GithubRepo) => {
    setSelecting(repo.fullName)
    try {
      const res = await fetch('/api/seller/github/repos/select', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: repo.fullName, defaultBranch: repo.defaultBranch }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Could not select repository')
      setSelectedRepo(repo)
      setPickerOpen(false)
      toast.success(`${repo.name} selected`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not select repository')
    } finally {
      setSelecting(null)
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
              Connect GitHub to pick one of your public or private repositories. Sell it directly from the{' '}
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
                <p className="mt-0.5 text-sm text-muted-foreground">{repos.length} repos accessible</p>
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
              Link your GitHub to pick a public or private repository to sell on the marketplace.
            </p>
            <Button variant="default" className="bg-[#24292f] text-white hover:bg-[#32383f]" asChild>
              <a href="/api/auth/github"><Github className="size-4" /> Connect GitHub</a>
            </Button>
          </div>
        )}
      </Card>

      {connected && !loading && selectedRepo?.unavailable && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
          <p className="text-sm text-destructive">
            <strong>{selectedRepo.fullName}</strong> is no longer accessible with your GitHub connection — it may have been renamed, made private without access, or deleted. Choose a different repository below.
          </p>
        </div>
      )}

      {connected && !loading && selectedRepo && !selectedRepo.unavailable && (
        <>
          <div className="mb-5 flex items-center justify-between gap-4">
            <h3 className="text-sm font-semibold text-muted-foreground">Selected repository</h3>
            <Button variant="outline" size="sm" onClick={() => setPickerOpen(true)}>
              <ArrowLeftRight className="size-3.5" /> Change repository
            </Button>
          </div>

          <Card interactive className="flex flex-col gap-3 p-5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <a
                  href={selectedRepo.htmlUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-1.5 text-sm font-semibold transition-colors hover:text-primary"
                >
                  {selectedRepo.name}
                  <ExternalLink className="size-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
                </a>
                <p className="mt-0.5 text-xs text-muted-foreground">{selectedRepo.fullName}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {selectedRepo.private && (
                  <Badge variant="outline"><Lock className="size-3" /> Private</Badge>
                )}
                {listedRepoNames.has(selectedRepo.fullName) && (
                  <Badge variant="success"><Check className="size-3" /> Listed</Badge>
                )}
              </div>
            </div>

            {selectedRepo.description && (
              <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">{selectedRepo.description}</p>
            )}

            {selectedRepo.topics.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {selectedRepo.topics.slice(0, 4).map((topic) => (
                  <Badge key={topic} variant="brand">{topic}</Badge>
                ))}
              </div>
            )}

            <RepoMeta repo={selectedRepo} />

            {listedRepoNames.has(selectedRepo.fullName) ? (
              <Button disabled variant="outline" className="w-full">
                <Check className="size-4" /> Already Listed
              </Button>
            ) : (
              <Button variant="gradient" className="w-full" asChild>
                <Link href={`/panel/seller/add-product?mode=github&repo=${encodeURIComponent(selectedRepo.fullName)}`}>
                  <DollarSign className="size-4" /> Sell This Repo
                </Link>
              </Button>
            )}
          </Card>
        </>
      )}

      {connected && !loading && !selectedRepo && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
          <span className="mb-4 grid size-12 place-items-center rounded-2xl bg-muted text-muted-foreground">
            <Github className="size-6" />
          </span>
          <h3 className="font-semibold">No repository selected</h3>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            Choose a public or private repository to sell on the marketplace.
          </p>
          <Button variant="gradient" className="mt-5" onClick={() => setPickerOpen(true)}>
            <Github className="size-4" /> Choose a repository
          </Button>
        </div>
      )}

      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Choose a repository</DialogTitle>
            <DialogDescription>
              Pick one public or private repository to work with. You can change this later.
            </DialogDescription>
          </DialogHeader>

          <Input
            type="text"
            placeholder="Search repositories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
            {filtered.length === 0 ? (
              <EmptyState icon="Package" title="No repositories found" description="Try a different search term." />
            ) : (
              filtered.map((repo) => {
                const isCurrent = selectedRepo?.fullName === repo.fullName
                return (
                  <button
                    key={repo.id}
                    type="button"
                    onClick={() => handleSelectRepo(repo)}
                    disabled={selecting !== null}
                    className="flex w-full items-center justify-between gap-4 rounded-xl border border-border p-4 text-left transition-colors hover:border-primary/40 hover:bg-primary/5 disabled:opacity-60"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-semibold">{repo.name}</span>
                        {repo.private && <Lock className="size-3 shrink-0 text-muted-foreground" />}
                        {isCurrent && <Badge variant="success" className="shrink-0">Current</Badge>}
                      </div>
                      {repo.description && (
                        <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{repo.description}</p>
                      )}
                    </div>
                    <span className="shrink-0 text-xs font-medium text-primary">
                      {selecting === repo.fullName ? 'Selecting…' : isCurrent ? 'Selected' : 'Select'}
                    </span>
                  </button>
                )
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
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
