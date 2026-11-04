import { NextRequest, NextResponse } from 'next/server'
import type { Readable } from 'stream'
import { query } from '@/lib/db'
import { getClientIp, isAdminGuardError, logAdminAction, requireAdmin } from '@/lib/admin'
import { downloadDeliverableStream } from '@/lib/sftp'
import { scanStream, MalwareScanUnavailableError } from '@/lib/malware-scan'

/**
 * Lets an admin run (or re-run) a malware scan against a specific product
 * version's already-stored deliverable — the backlog-clearing tool for
 * every version marked 'unscanned_legacy' (published before scanning
 * existed), and the way a version can be re-checked if ClamAV's signature
 * database has since been updated. Never auto-runs on its own; an admin
 * explicitly triggers it per version.
 */
export async function POST(_req: NextRequest, { params }: { params: { versionId: string } }) {
  const guard = await requireAdmin()
  if (isAdminGuardError(guard)) return guard
  const adminId = guard.id

  const versionRes = await query<{
    id: string; product_id: string; status: string
    deliverable_remote_path: string | null; deliverable_original_name: string | null
    scan_status: string
  }>(
    `SELECT id, product_id, status, deliverable_remote_path, deliverable_original_name, scan_status
     FROM product_versions WHERE id = $1`,
    [params.versionId]
  )
  if ((versionRes.rowCount ?? 0) === 0) {
    return NextResponse.json({ error: 'Version not found' }, { status: 404 })
  }
  const version = versionRes.rows[0]

  if (!version.deliverable_remote_path) {
    return NextResponse.json(
      { error: 'This version has no stored deliverable to scan (e.g. a legacy GitHub listing with no snapshot).' },
      { status: 400 }
    )
  }

  const ipAddress = getClientIp(_req)

  try {
    const { stream } = await downloadDeliverableStream(version.deliverable_remote_path)
    const outcome = await scanStream(stream as unknown as Readable)

    const newStatus = outcome.status === 'infected' ? 'infected' : 'clean'
    const scanResult = outcome.status === 'infected' ? outcome.viruses.join(', ') : null

    await query(
      `UPDATE product_versions SET scan_status = $1, scan_result = $2, scanned_at = NOW() WHERE id = $3`,
      [newStatus, scanResult, version.id]
    )

    await logAdminAction({
      adminId,
      action: outcome.status === 'infected' ? 'product_version.rescan_infected' : 'product_version.rescan_clean',
      targetType: 'product_version',
      targetId: version.id,
      reason: 'Admin-triggered malware rescan',
      previousValue: { scanStatus: version.scan_status },
      newValue: { scanStatus: newStatus, scanResult },
      ipAddress,
    })

    return NextResponse.json({ ok: true, scanStatus: newStatus, scanResult })
  } catch (err) {
    if (err instanceof MalwareScanUnavailableError) {
      return NextResponse.json({ error: 'The security scanner is currently unavailable.' }, { status: 503 })
    }
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[admin/product-versions/rescan] failed:', version.id, message, err)
    return NextResponse.json({ error: `Could not rescan this file: ${message}` }, { status: 502 })
  }
}
