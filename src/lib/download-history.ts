import { query } from '@/lib/db'

/**
 * Records a successful buyer download for the Download History page.
 * Deliberately swallows its own errors — a logging failure must never turn
 * an otherwise-successful download into an error response for the buyer.
 */
export async function recordDownloadEvent(
  orderId: string,
  buyerId: string,
  productVersionId: string | null
): Promise<void> {
  try {
    await query(
      `INSERT INTO download_events (order_id, buyer_id, product_version_id) VALUES ($1, $2, $3)`,
      [orderId, buyerId, productVersionId]
    )
  } catch (err) {
    console.error('[download-history] failed to record download event:', err)
  }
}
