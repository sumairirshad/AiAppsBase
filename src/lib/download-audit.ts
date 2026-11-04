import { NextRequest } from 'next/server'
import { query } from '@/lib/db'

/** Same client-IP resolution used by lib/admin.ts and lib/rate-limit.ts — the first hop in X-Forwarded-For, falling back to X-Real-IP. */
export function getRequestIp(req: NextRequest): string | null {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return req.headers.get('x-real-ip')
}

export type DownloadAttemptEntry = {
  orderId: string
  buyerId: string
  sellerId: string
  productId: string
  productVersionId: string | null
  fileName: string | null
  fileSha256: string | null
  fileSizeBytes: number | null
  ipAddress: string | null
  userAgent: string | null
  scanStatus: string | null
  warningShown?: boolean
  overrideRequested?: boolean
  overridePasswordVerified?: boolean
  overrideEmailVerified?: boolean
  status: 'success' | 'blocked' | 'failed'
  blockReason?: string | null
}

/**
 * Records one download attempt against an order — successful, blocked (not
 * entitled, infected with no valid override, scan not yet done), or failed
 * (storage error after passing every check). This is the only write path
 * into download_audit_log: there is no UPDATE or DELETE anywhere in the app
 * touching this table, so once written a row stands as evidence independent
 * of either the buyer's or seller's own account of events.
 *
 * Best-effort: a logging failure must never block the underlying download,
 * so failures are logged to stderr and swallowed here — mirroring
 * lib/admin.ts#logAdminAction.
 */
export async function logDownloadAttempt(entry: DownloadAttemptEntry): Promise<void> {
  try {
    await query(
      `INSERT INTO download_audit_log (
         order_id, buyer_id, seller_id, product_id, product_version_id,
         file_name, file_sha256, file_size_bytes,
         ip_address, user_agent, scan_status,
         warning_shown, override_requested, override_password_verified, override_email_verified,
         status, block_reason
       ) VALUES ($1,$2,$3,$4,$5, $6,$7,$8, $9,$10,$11, $12,$13,$14,$15, $16,$17)`,
      [
        entry.orderId, entry.buyerId, entry.sellerId, entry.productId, entry.productVersionId,
        entry.fileName, entry.fileSha256, entry.fileSizeBytes,
        entry.ipAddress, entry.userAgent, entry.scanStatus,
        entry.warningShown ?? false, entry.overrideRequested ?? false,
        entry.overridePasswordVerified ?? false, entry.overrideEmailVerified ?? false,
        entry.status, entry.blockReason ?? null,
      ]
    )
  } catch (error) {
    console.error('[download-audit] Failed to write download audit log entry', entry.orderId, entry.status, error)
  }
}
