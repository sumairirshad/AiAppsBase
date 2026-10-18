import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getSessionUserId } from '@/lib/session'
import { uploadDeliverable, deleteDeliverable } from '@/lib/sftp'
import { isAllowedDeliverableUpload } from '@/lib/upload-safety'

/**
 * Legacy direct deliverable replace/delete. AUD finding: this previously let
 * a seller overwrite or delete a product's file at any time, including
 * after buyers had already completed orders against it — silently changing
 * what a historical purchase would download next, or deleting it outright.
 *
 * Now blocked once the product has ANY completed order, or is already
 * using the version system (every product gets a current_version_id —
 * see migration 030 — so after that migration this covers all products).
 * Sellers must use POST /api/products/[id]/versions instead, which creates
 * a new immutable version rather than mutating the current one.
 */
async function blockIfVersionedOrSold(productId: string): Promise<NextResponse | null> {
  const res = await query(
    `SELECT
       (SELECT current_version_id FROM products WHERE id = $1) IS NOT NULL AS is_versioned,
       EXISTS (SELECT 1 FROM orders WHERE product_id = $1 AND status = 'completed') AS has_completed_orders`,
    [productId]
  )
  const { is_versioned, has_completed_orders } = res.rows[0]
  if (is_versioned || has_completed_orders) {
    return NextResponse.json(
      {
        error:
          'This product already has a published version and cannot have its deliverable replaced directly. ' +
          'Use "Publish new version" instead, which keeps every past version downloadable for buyers who already own it.',
      },
      { status: 409 }
    )
  }
  return null
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getSessionUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const existing = await query(
    'SELECT id, deliverable_remote_path, github_repo_name FROM products WHERE id = $1 AND seller_id = $2',
    [params.id, userId]
  )
  if ((existing.rowCount ?? 0) === 0) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }
  const product = existing.rows[0]

  if (product.github_repo_name) {
    return NextResponse.json({ error: 'GitHub-based listings don\'t use an uploaded deliverable' }, { status: 400 })
  }

  const blocked = await blockIfVersionedOrSold(params.id)
  if (blocked) return blocked

  const formData = await req.formData()
  const deliverableFile = formData.get('deliverableFile') as File | null

  if (!deliverableFile || deliverableFile.size === 0) {
    return NextResponse.json({ error: 'Please choose a .zip or .rar file' }, { status: 400 })
  }

  if (!isAllowedDeliverableUpload(deliverableFile.name)) {
    return NextResponse.json({ error: 'The deliverable file must be a .zip or .rar archive' }, { status: 400 })
  }

  try {
    const buffer = Buffer.from(await deliverableFile.arrayBuffer())
    const { remotePath } = await uploadDeliverable(buffer, params.id, deliverableFile.name)

    await query(
      `UPDATE products SET
        deliverable_remote_path = $1, deliverable_original_name = $2, deliverable_size_bytes = $3,
        status = CASE WHEN status = 'approved' THEN 'pending' ELSE status END,
        updated_at = NOW()
       WHERE id = $4 AND seller_id = $5`,
      [remotePath, deliverableFile.name, deliverableFile.size, params.id, userId]
    )

    if (product.deliverable_remote_path) {
      deleteDeliverable(product.deliverable_remote_path).catch((err) =>
        console.error('[products/deliverable] failed to clean up old file:', err.message)
      )
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[products/deliverable] upload failed:', message, err)
    return NextResponse.json({ error: `Could not reach file storage server: ${message}` }, { status: 502 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getSessionUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const existing = await query(
    'SELECT id, deliverable_remote_path FROM products WHERE id = $1 AND seller_id = $2',
    [params.id, userId]
  )
  if ((existing.rowCount ?? 0) === 0) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  const blocked = await blockIfVersionedOrSold(params.id)
  if (blocked) return blocked

  const remotePath = existing.rows[0].deliverable_remote_path

  await query(
    `UPDATE products SET
      deliverable_remote_path = NULL, deliverable_original_name = NULL, deliverable_size_bytes = NULL,
      updated_at = NOW()
     WHERE id = $1 AND seller_id = $2`,
    [params.id, userId]
  )

  if (remotePath) {
    deleteDeliverable(remotePath).catch((err) =>
      console.error('[products/deliverable] failed to delete remote file:', err.message)
    )
  }

  return NextResponse.json({ ok: true })
}
