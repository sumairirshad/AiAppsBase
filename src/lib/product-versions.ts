import { PoolClient } from 'pg'
import { query, withTransaction } from '@/lib/db'

export const MAX_VERSION_LENGTH = 50

/** Trims and validates a seller-supplied version identifier. Deliberately lenient about
 * format (not strict semver) — sellers use "1.0.0", "v2", "2024.10", etc. */
export function normalizeVersionString(raw: unknown): { ok: true; version: string } | { ok: false; error: string } {
  const version = typeof raw === 'string' ? raw.trim() : ''
  if (!version) return { ok: false, error: 'Please enter a version identifier (e.g. 1.0.0).' }
  if (version.length > MAX_VERSION_LENGTH) return { ok: false, error: `Version identifier must be ${MAX_VERSION_LENGTH} characters or fewer.` }
  if (/[\s/\\]/.test(version)) return { ok: false, error: 'Version identifier cannot contain spaces or slashes.' }
  return { ok: true, version }
}

export type ReserveResult =
  | { ok: true; versionId: string }
  | { ok: false; reason: 'duplicate_version'; message: string }

/**
 * Atomically reserves a version string for a product before any slow I/O
 * (file upload, GitHub fetch) begins. Two concurrent publish requests for
 * the same product are serialized by a Postgres advisory lock scoped to
 * the product id, so only one can ever reserve a given version string —
 * the other gets 'duplicate_version' immediately rather than both starting
 * uploads and racing to publish.
 *
 * A 'publishing' row left behind by a crashed/killed request (never reached
 * finalize/fail) is treated as abandoned after 15 minutes and its version
 * string freed up again — otherwise a single crash would permanently
 * squat that version identifier.
 */
export async function reserveProductVersion(
  productId: string,
  sellerId: string,
  version: string,
  deliveryType: 'upload' | 'github',
  releaseNotes: string | null,
  notifyBuyers: boolean
): Promise<ReserveResult> {
  return withTransaction(async (client: PoolClient) => {
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [productId])

    await client.query(
      `UPDATE product_versions SET status = 'failed'
       WHERE product_id = $1 AND status = 'publishing' AND created_at < NOW() - INTERVAL '15 minutes'`,
      [productId]
    )

    const existing = await client.query(
      `SELECT 1 FROM product_versions WHERE product_id = $1 AND version = $2 AND status IN ('publishing', 'published')`,
      [productId, version]
    )
    if ((existing.rowCount ?? 0) > 0) {
      return {
        ok: false,
        reason: 'duplicate_version',
        message: 'This version already exists in the marketplace. Please choose a new version number.',
      }
    }

    const inserted = await client.query<{ id: string }>(
      `INSERT INTO product_versions (product_id, seller_id, version, delivery_type, release_notes, notify_buyers, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'publishing')
       RETURNING id`,
      [productId, sellerId, version, deliveryType, releaseNotes, notifyBuyers]
    )
    return { ok: true, versionId: inserted.rows[0].id }
  })
}

/** Marks a reserved version as failed (upload or snapshot step didn't complete) and frees its version string for retry. */
export async function failProductVersion(versionId: string): Promise<void> {
  await query(`UPDATE product_versions SET status = 'failed' WHERE id = $1 AND status = 'publishing'`, [versionId])
}

/**
 * Records a brand-new product's own deliverable as its "1.0.0" version,
 * right after the product row itself is inserted — reusing the exact same
 * reserve/finalize machinery a later "publish a new version" uses, so this
 * listing has real version history from the start instead of only existing
 * as a bare products.* column. There are no buyers yet, so this never
 * notifies anyone.
 */
export async function createInitialPublishedVersion(
  productId: string,
  sellerId: string,
  deliveryType: 'upload' | 'github',
  deliverable: DeliverableSnapshot
): Promise<void> {
  const reserved = await reserveProductVersion(productId, sellerId, '1.0.0', deliveryType, null, false)
  if (!reserved.ok) {
    // A brand-new product can't already have a "1.0.0" version on record —
    // this can only mean the insert above is being retried.
    throw new Error(reserved.message)
  }
  await finalizeProductVersion(reserved.versionId, productId, deliverable)
}

export type DeliverableSnapshot = {
  remotePath: string
  originalName: string | null
  sizeBytes: number | null
  sha256: string | null
  githubRepoName?: string | null
  githubBranch?: string | null
  githubCommitSha?: string | null
}

/**
 * Marks a version published and, in the SAME transaction, makes it the
 * product's current version and — only if the seller opted in for this
 * publication — fans notifications out to every eligible previous buyer.
 *
 * Doing this as one transaction is what makes "publication succeeded" and
 * "notifications were created" atomic: either both happened, or (on any
 * error) neither did, and there is never a window where the version is
 * live but the notify step silently never ran or partially ran. Re-running
 * this function for the same versionId is safe — the UPDATE is a no-op
 * once already published, and the notification INSERT is deduplicated by
 * the (buyer_id, product_version_id) unique constraint.
 */
export async function finalizeProductVersion(
  versionId: string,
  productId: string,
  deliverable: DeliverableSnapshot
): Promise<void> {
  await withTransaction(async (client) => {
    await client.query(
      `UPDATE product_versions SET
         status = 'published', published_at = COALESCE(published_at, NOW()),
         deliverable_remote_path = $1, deliverable_original_name = $2, deliverable_size_bytes = $3, deliverable_sha256 = $4,
         github_repo_name = COALESCE($5, github_repo_name), github_branch = COALESCE($6, github_branch),
         github_commit_sha = COALESCE($7, github_commit_sha)
       WHERE id = $8`,
      [
        deliverable.remotePath, deliverable.originalName, deliverable.sizeBytes, deliverable.sha256,
        deliverable.githubRepoName ?? null, deliverable.githubBranch ?? null, deliverable.githubCommitSha ?? null,
        versionId,
      ]
    )

    const versionRes = await client.query<{ version: string; release_notes: string | null; notify_buyers: boolean }>(
      `SELECT version, release_notes, notify_buyers FROM product_versions WHERE id = $1`,
      [versionId]
    )
    const versionRow = versionRes.rows[0]

    await client.query(
      `UPDATE products SET current_version_id = $1, version = $2, updated_at = NOW() WHERE id = $3`,
      [versionId, versionRow.version, productId]
    )

    if (versionRow.notify_buyers) {
      const productRes = await client.query<{ title: string }>('SELECT title FROM products WHERE id = $1', [productId])
      const productTitle = productRes.rows[0]?.title ?? 'a product you purchased'
      const body = versionRow.release_notes
        ? `${productTitle} has been updated to version ${versionRow.version}. ${versionRow.release_notes}`
        : `${productTitle} has been updated to version ${versionRow.version}. You can download the new version if you wish.`

      // Explicit casts: without them, Postgres's untyped-parameter inference
      // for this specific shape (the same $N used once in the SELECT target
      // list and once in a WHERE comparison) raises "inconsistent types
      // deduced for parameter" even though both uses are the same type.
      await client.query(
        `INSERT INTO buyer_notifications (buyer_id, product_id, product_version_id, title, body, link_url)
         SELECT DISTINCT o.buyer_id, $1::uuid, $2::uuid, $3::text, $4::text, $5::text
         FROM orders o
         WHERE o.product_id = $1::uuid AND o.status = 'completed' AND o.product_version_id IS DISTINCT FROM $2::uuid
         ON CONFLICT (buyer_id, product_version_id) DO NOTHING`,
        [productId, versionId, `New version available: ${productTitle}`, body, `/product/${productId}`]
      )
      await client.query(`UPDATE product_versions SET notification_dispatch_status = 'sent' WHERE id = $1`, [versionId])
    } else {
      await client.query(
        `UPDATE product_versions SET notification_dispatch_status = 'not_requested' WHERE id = $1 AND notification_dispatch_status = 'pending'`,
        [versionId]
      )
    }
  })
}

export type ProductVersionRow = {
  id: string
  version: string
  deliveryType: 'upload' | 'github'
  status: 'publishing' | 'published' | 'failed'
  releaseNotes: string | null
  notifyBuyers: boolean
  isLegacySnapshot: boolean
  isCurrent: boolean
  githubRepoName: string | null
  githubBranch: string | null
  githubCommitSha: string | null
  deliverableOriginalName: string | null
  deliverableSizeBytes: number | null
  createdAt: string
  publishedAt: string | null
}

/** Full version history for a product, newest first — for the seller's version-history UI. */
export async function listProductVersions(productId: string, sellerId: string): Promise<ProductVersionRow[]> {
  const res = await query(
    `SELECT v.*, (p.current_version_id = v.id) AS is_current
     FROM product_versions v
     JOIN products p ON p.id = v.product_id
     WHERE v.product_id = $1 AND v.seller_id = $2
     ORDER BY v.created_at DESC`,
    [productId, sellerId]
  )
  return res.rows.map((r: any): ProductVersionRow => ({
    id: r.id,
    version: r.version,
    deliveryType: r.delivery_type,
    status: r.status,
    releaseNotes: r.release_notes,
    notifyBuyers: r.notify_buyers,
    isLegacySnapshot: r.is_legacy_snapshot,
    isCurrent: Boolean(r.is_current),
    githubRepoName: r.github_repo_name,
    githubBranch: r.github_branch,
    githubCommitSha: r.github_commit_sha,
    deliverableOriginalName: r.deliverable_original_name,
    deliverableSizeBytes: r.deliverable_size_bytes != null ? Number(r.deliverable_size_bytes) : null,
    createdAt: new Date(r.created_at).toISOString(),
    publishedAt: r.published_at ? new Date(r.published_at).toISOString() : null,
  }))
}

export type ResolvedDeliverable = {
  deliveryType: 'upload' | 'github'
  deliverableRemotePath: string | null
  deliverableOriginalName: string | null
  githubRepoName: string | null
  githubBranch: string | null
  githubCommitSha: string | null
}

/**
 * Resolves exactly what a given order is entitled to download: the version
 * it was bound to at purchase time if one is recorded, otherwise (older
 * orders predating this system) the product's current version — never
 * "whatever the product's current/latest version happens to be right now"
 * when a specific version IS on record, which is the whole point of
 * purchase-specific entitlements.
 */
export async function resolveOrderDeliverable(
  productId: string,
  productVersionId: string | null
): Promise<ResolvedDeliverable | null> {
  const versionId = productVersionId
  if (versionId) {
    const res = await query(
      `SELECT delivery_type, deliverable_remote_path, deliverable_original_name,
              github_repo_name, github_branch, github_commit_sha
       FROM product_versions WHERE id = $1 AND product_id = $2`,
      [versionId, productId]
    )
    if ((res.rowCount ?? 0) > 0) {
      const r = res.rows[0]
      return {
        deliveryType: r.delivery_type,
        deliverableRemotePath: r.deliverable_remote_path,
        deliverableOriginalName: r.deliverable_original_name,
        githubRepoName: r.github_repo_name,
        githubBranch: r.github_branch,
        githubCommitSha: r.github_commit_sha,
      }
    }
  }

  // No version on record at all (pre-migration edge case that somehow
  // wasn't backfilled) — fall back to the product's live columns, exactly
  // the behavior this app had before versioning existed.
  const productRes = await query(
    `SELECT github_repo_name, github_default_branch, deliverable_remote_path, deliverable_original_name
     FROM products WHERE id = $1`,
    [productId]
  )
  if ((productRes.rowCount ?? 0) === 0) return null
  const p = productRes.rows[0]
  return {
    deliveryType: p.github_repo_name ? 'github' : 'upload',
    deliverableRemotePath: p.deliverable_remote_path,
    deliverableOriginalName: p.deliverable_original_name,
    githubRepoName: p.github_repo_name,
    githubBranch: p.github_default_branch,
    githubCommitSha: null,
  }
}
