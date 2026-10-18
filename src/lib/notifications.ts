import { query } from '@/lib/db'

export type BuyerNotification = {
  id: string
  title: string
  body: string
  linkUrl: string
  read: boolean
  createdAt: string
  productId: string
  productName: string
  newVersion: string
  previousVersion: string | null
  releaseNotes: string | null
  publishedAt: string | null
}

/**
 * A buyer's notifications, newest first. previousVersion is resolved
 * per-notification from the buyer's own other completed orders for the same
 * product — a buyer who owns several old versions of one product still
 * gets a sensible "you have X, now there's Y" even though that's not
 * stored directly on the notification row itself.
 */
export async function listBuyerNotifications(buyerId: string, limit = 50): Promise<BuyerNotification[]> {
  const res = await query(
    `SELECT n.id, n.title, n.body, n.link_url, n.read_at, n.created_at,
            p.id AS product_id, p.title AS product_name,
            pv.version AS new_version, pv.release_notes, pv.published_at,
            prev.version AS previous_version
     FROM buyer_notifications n
     JOIN products p ON p.id = n.product_id
     JOIN product_versions pv ON pv.id = n.product_version_id
     LEFT JOIN LATERAL (
       SELECT ov.version
       FROM orders o
       JOIN product_versions ov ON ov.id = o.product_version_id
       WHERE o.buyer_id = n.buyer_id AND o.product_id = n.product_id AND o.status = 'completed'
         AND o.product_version_id IS DISTINCT FROM n.product_version_id
       ORDER BY o.created_at DESC LIMIT 1
     ) prev ON true
     WHERE n.buyer_id = $1
     ORDER BY n.created_at DESC
     LIMIT $2`,
    [buyerId, limit]
  )
  return res.rows.map((r: any): BuyerNotification => ({
    id: r.id,
    title: r.title,
    body: r.body,
    linkUrl: r.link_url,
    read: r.read_at != null,
    createdAt: new Date(r.created_at).toISOString(),
    productId: r.product_id,
    productName: r.product_name,
    newVersion: r.new_version,
    previousVersion: r.previous_version ?? null,
    releaseNotes: r.release_notes ?? null,
    publishedAt: r.published_at ? new Date(r.published_at).toISOString() : null,
  }))
}

export async function getUnreadNotificationCount(buyerId: string): Promise<number> {
  const res = await query<{ count: string }>(
    `SELECT COUNT(*) AS count FROM buyer_notifications WHERE buyer_id = $1 AND read_at IS NULL`,
    [buyerId]
  )
  return Number(res.rows[0]?.count ?? 0)
}

/** Marks one notification read. Scoped to buyerId so a buyer can never mark (or even address) someone else's notification. */
export async function markNotificationRead(buyerId: string, notificationId: string): Promise<boolean> {
  const res = await query(
    `UPDATE buyer_notifications SET read_at = COALESCE(read_at, NOW()) WHERE id = $1 AND buyer_id = $2`,
    [notificationId, buyerId]
  )
  return (res.rowCount ?? 0) > 0
}

export async function markAllNotificationsRead(buyerId: string): Promise<void> {
  await query(`UPDATE buyer_notifications SET read_at = NOW() WHERE buyer_id = $1 AND read_at IS NULL`, [buyerId])
}
