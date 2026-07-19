import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getSessionUserId } from '@/lib/session'
import { uploadDeliverable, deleteDeliverable } from '@/lib/sftp'

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

  const formData = await req.formData()
  const deliverableFile = formData.get('deliverableFile') as File | null

  if (!deliverableFile || deliverableFile.size === 0) {
    return NextResponse.json({ error: 'Please choose a .zip or .rar file' }, { status: 400 })
  }

  const lowerName = deliverableFile.name.toLowerCase()
  if (!lowerName.endsWith('.zip') && !lowerName.endsWith('.rar')) {
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
