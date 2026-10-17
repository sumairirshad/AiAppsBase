'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Github, Star, GitFork, ExternalLink, RefreshCw,
  AlertCircle, Unlink, Clock, Lock,
  Check, DollarSign, PlusCircle, Trash2,
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
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

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
  const [selectedRepos, setSelectedRepos] = useState<GithubRepo[]>([])
  const [search, setSearch] = useState('')
  const [disconnecting, setDisconnecting] = useState(false)
  const [disconnectConfirmOpen, setDisconnectConfirmOpen] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pendingFullName, setPendingFullName] = useState<string | null>(null)
  const [removingFullName, setRemovingFullName] = useState<string | null>(null)

  const fetchRepos = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/seller/github/repos')
      const data = await res.json()
      setConnected(data.connected ?? false)
      setGithubUsername(data.githubUsername ?? null)
      setRepos(data.repos ?? [])
      setListedRepoNames(new Set(data.listedRepoNames ?? []))
      setSelectedRepos(data.selectedRepos ?? [])
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
  // connected seller hasn't selected any repo yet — never dump the full
  // list on the page itself.
  useEffect(() => {
    if (loading || !connected) return
    const justConnected = searchParams.get('connected') === '1'
    if (justConnected || selectedRepos.length === 0) setPickerOpen(true)
  }, [loading, connected, selectedRepos.length, searchParams])

  const handleDisconnect = async () => {
    setDisconnecting(true)
    try {
      await fetch('/api/seller/github/disconnect', { method: 'DELETE' })
      setConnected(false)
      setGithubUsername(null)
      setRepos([])
      setSelectedRepos([])
      setDisconnectConfirmOpen(false)
      toast.success('GitHub disconnected')
    } catch {
      toast.error('Failed to disconnect')
    } finally {
      setDisconnecting(false)
    }
  }

  const selectedFullNames = new Set(selectedRepos.map((r) => r.fullName))

  const handleAddRepo = async (repo: GithubRepo) => {
    setPendingFullName(repo.fullName)
    try {
      const res = await fetch('/api/seller/github/repos/select', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: repo.fullName, defaultBranch: repo.defaultBranch }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Could not select repository')
      setSelectedRepos((prev) => [...prev, repo])
      toast.success(`${repo.name} selected`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not select repository')
    } finally {
      setPendingFullName(null)
    }
  }

  const handleRemoveRepo = async (repo: GithubRepo) => {
    setRemovingFullName(repo.fullName)
    try {
      const res = await fetch(`/api/seller/github/repos/select?fullName=${encodeURIComponent(repo.fullName)}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Could not remove repository')
      setSelectedRepos((prev) => prev.filter((r) => r.fullName !== repo.fullName))
      toast.success(`${repo.name} removed`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not remove repository')
    } finally {
      setRemovingFullName(null)
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
              Connect GitHub to pick one or more public or private repositories. Sell any of them directly from the{' '}
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
                onClick={() => setDisconnectConfirmOpen(true)}
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
              Link your GitHub to pick public or private repositories to sell on the marketplace.
            </p>
            <Button variant="default" className="bg-[#24292f] text-white hover:bg-[#32383f]" asChild>
              <a href="/api/auth/github"><Github className="size-4" /> Connect GitHub</a>
            </Button>
          </div>
        )}
      </Card>

      {connected && !loading && selectedRepos.length > 0 && (
        <>
          <div className="mb-5 flex items-center justify-between gap-4">
            <h3 className="text-sm font-semibold text-muted-foreground">
              Selected repositories ({selectedRepos.length})
            </h3>
            <Button variant="outline" size="sm" onClick={() => setPickerOpen(true)}>
              <PlusCircle className="size-3.5" /> Add repository
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {selectedRepos.map((repo) => (
              <Card key={repo.fullName} interactive className="flex flex-col gap-3 p-5">
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
                  <div className="flex shrink-0 items-center gap-2">
                    {repo.private && (
                      <Badge variant="outline"><Lock className="size-3" /> Private</Badge>
                    )}
                    {listedRepoNames.has(repo.fullName) && (
                      <Badge variant="success"><Check className="size-3" /> Listed</Badge>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveRepo(repo)}
                      disabled={removingFullName === repo.fullName}
                      aria-label={`Remove ${repo.name}`}
                      className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>

                {repo.unavailable && (
                  <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-2.5">
                    <AlertCircle className="mt-0.5 size-3.5 shrink-0 text-destructive" />
                    <p className="text-xs text-destructive">
                      No longer accessible — it may have been renamed, made private, or deleted.
                    </p>
                  </div>
                )}

                {repo.description && (
                  <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">{repo.description}</p>
                )}

                {repo.topics.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {repo.topics.slice(0, 4).map((topic) => (
                      <Badge key={topic} variant="brand">{topic}</Badge>
                    ))}
                  </div>
                )}

                <RepoMeta repo={repo} />

                {listedRepoNames.has(repo.fullName) ? (
                  <Button disabled variant="outline" className="w-full">
                    <Check className="size-4" /> Already Listed
                  </Button>
                ) : (
                  <Button variant="gradient" className="w-full" disabled={repo.unavailable} asChild={!repo.unavailable}>
                    {repo.unavailable ? (
                      <><DollarSign className="size-4" /> Sell This Repo</>
                    ) : (
                      <Link href={`/panel/seller/add-product?mode=github&repo=${encodeURIComponent(repo.fullName)}`}>
                        <DollarSign className="size-4" /> Sell This Repo
                      </Link>
                    )}
                  </Button>
                )}
              </Card>
            ))}
          </div>
        </>
      )}

      {connected && !loading && selectedRepos.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
          <span className="mb-4 grid size-12 place-items-center rounded-2xl bg-muted text-muted-foreground">
            <Github className="size-6" />
          </span>
          <h3 className="font-semibold">No repositories selected</h3>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            Choose one or more public or private repositories to sell on the marketplace.
          </p>
          <Button variant="gradient" className="mt-5" onClick={() => setPickerOpen(true)}>
            <Github className="size-4" /> Choose repositories
          </Button>
        </div>
      )}

      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Choose repositories</DialogTitle>
            <DialogDescription>
              Pick any number of public or private repositories to work with. You can add or remove them anytime.
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
                const isSelected = selectedFullNames.has(repo.fullName)
                const isBusy = pendingFullName === repo.fullName || removingFullName === repo.fullName
                return (
                  <div
                    key={repo.id}
                    className="flex w-full items-center justify-between gap-4 rounded-xl border border-border p-4 text-left transition-colors hover:border-primary/40"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-semibold">{repo.name}</span>
                        {repo.private && <Lock className="size-3 shrink-0 text-muted-foreground" />}
                        {isSelected && <Badge variant="success" className="shrink-0">Selected</Badge>}
                      </div>
                      {repo.description && (
                        <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{repo.description}</p>
                      )}
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant={isSelected ? 'outline' : 'default'}
                      className={isSelected ? 'shrink-0 text-destructive hover:bg-destructive/10' : 'shrink-0'}
                      disabled={isBusy}
                      onClick={() => (isSelected ? handleRemoveRepo(repo) : handleAddRepo(repo))}
                    >
                      {isBusy ? (
                        'Working…'
                      ) : isSelected ? (
                        <><Trash2 className="size-3.5" /> Remove</>
                      ) : (
                        'Select'
                      )}
                    </Button>
                  </div>
                )
              })
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPickerOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={disconnectConfirmOpen}
        onOpenChange={setDisconnectConfirmOpen}
        title="Disconnect GitHub?"
        description="Your listed products will remain, but you won't be able to list new repos until you reconnect."
        confirmLabel="Disconnect"
        destructive
        loading={disconnecting}
        onConfirm={handleDisconnect}
      />
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
