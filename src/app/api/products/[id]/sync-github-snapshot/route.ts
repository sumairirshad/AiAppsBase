import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getSessionUserId } from '@/lib/session'
import { snapshotGithubRepo } from '@/lib/github-snapshot'

/**
 * Lets a seller publish an update to a repo-delivered product: re-fetches
 * the repo archive at its current branch head and re-stores it, so buyers'
 * downloads pick up the new content instead of staying frozen at whatever
 * was approved originally.
 *
 * Mirrors how re-uploading a manual deliverable behaves (see
 * /api/products/[id]/deliverable): an already-approved listing goes back to
 * 'pending' so admin re-reviews the new content, since the repo's actual
 * contents just changed. A failed refresh leaves the existing, already-live
 * snapshot untouched — buyers keep downloading the last good one.
 */
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getSessionUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const productRes = await query<{
    github_repo_name: string | null
    github_default_branch: string | null
    status: string
  }>(
    'SELECT github_repo_name, github_default_branch, status FROM products WHERE id = $1 AND seller_id = $2',
    [params.id, userId]
  )
  if ((productRes.rowCount ?? 0) === 0) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }
  const { github_repo_name: repoName, github_default_branch: branch, status } = productRes.rows[0]
  if (!repoName) {
    return NextResponse.json({ error: 'This product has no linked GitHub repo' }, { status: 400 })
  }

  const snapshot = await snapshotGithubRepo(params.id, userId, repoName, branch || 'main')
  if (!snapshot.ok) {
    return NextResponse.json({ error: snapshot.error }, { status: 502 })
  }

  if (status === 'approved') {
    await query(
      `UPDATE products SET status = 'pending', updated_at = NOW() WHERE id = $1 AND seller_id = $2`,
      [params.id, userId]
    )
  }

  return NextResponse.json({
    ok: true,
    private: snapshot.private,
    commitSha: snapshot.commitSha,
    sizeBytes: snapshot.sizeBytes,
    statusReset: status === 'approved',
  })
}
