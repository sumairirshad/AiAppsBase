import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getSessionUserId } from '@/lib/session'
import { syncProductGithubStats } from '@/lib/github-stats'

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getSessionUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const productRes = await query<{ github_repo_name: string | null; github_default_branch: string | null }>(
    'SELECT github_repo_name, github_default_branch FROM products WHERE id = $1 AND seller_id = $2',
    [params.id, userId]
  )
  if ((productRes.rowCount ?? 0) === 0) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { github_repo_name: repoName, github_default_branch: defaultBranch } = productRes.rows[0]
  if (!repoName) {
    return NextResponse.json({ error: 'This product has no linked GitHub repo' }, { status: 400 })
  }

  const stats = await syncProductGithubStats(params.id, userId, repoName, defaultBranch)
  if (!stats) {
    return NextResponse.json(
      { error: 'Could not reach GitHub for this repo — check your GitHub connection and try again' },
      { status: 502 }
    )
  }

  return NextResponse.json({ ok: true, stats })
}
