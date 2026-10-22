import { randomUUID } from 'crypto'
import { query } from '@/lib/db'

/**
 * Seeding/cleanup helpers for integration tests that run against a real
 * Postgres database (see src/**\/*.integration.test.ts). Not a test file
 * itself — nothing here matches vitest's include pattern.
 */

export async function createTestUser(
  opts: Partial<{
    role: 'buyer' | 'seller' | 'admin'
    sellerStatus: string
    accountStatus: string
    sessionVersion: number
    stripeAccountId: string | null
    stripePayoutsEnabled: boolean
  }> = {}
): Promise<{ id: string; email: string }> {
  const id = randomUUID()
  const email = `test-${id}@example.com`
  await query(
    `INSERT INTO users
       (id, full_name, email, password_hash, role, seller_status, account_status, session_version,
        stripe_account_id, stripe_payouts_enabled, is_verified)
     VALUES ($1, 'Test User', $2, 'x', $3, $4, $5, $6, $7, $8, true)`,
    [
      id,
      email,
      opts.role ?? 'buyer',
      opts.sellerStatus ?? 'approved',
      opts.accountStatus ?? 'active',
      opts.sessionVersion ?? 0,
      opts.stripeAccountId ?? null,
      opts.stripePayoutsEnabled ?? false,
    ]
  )
  return { id, email }
}

export async function createTestProduct(
  sellerId: string,
  opts: Partial<{ price: number; status: string }> = {}
): Promise<string> {
  const id = randomUUID()
  await query(
    `INSERT INTO products (id, seller_id, title, description, price, category, human_mod_level, license_type, status)
     VALUES ($1, $2, 'Test product', 'A product used only in tests', $3, 'web-app', 'none', 'commercial', $4)`,
    [id, sellerId, opts.price ?? 20, opts.status ?? 'approved']
  )
  return id
}

export async function createTestProductVersion(
  productId: string,
  sellerId: string,
  opts: Partial<{
    version: string
    status: 'publishing' | 'published' | 'failed'
    deliveryType: 'upload' | 'github'
    deliverableRemotePath: string | null
    setAsCurrent: boolean
  }> = {}
): Promise<string> {
  const status = opts.status ?? 'published'
  const deliveryType = opts.deliveryType ?? 'upload'
  const deliverableRemotePath =
    'deliverableRemotePath' in opts ? opts.deliverableRemotePath : status === 'published' ? '/remote/test-file.zip' : null
  const res = await query<{ id: string }>(
    `INSERT INTO product_versions (product_id, seller_id, version, delivery_type, status, deliverable_remote_path, published_at)
     VALUES ($1, $2, $3, $4, $5, $6, CASE WHEN $5 = 'published' THEN NOW() ELSE NULL END)
     RETURNING id`,
    [productId, sellerId, opts.version ?? '1.0.0', deliveryType, status, deliverableRemotePath]
  )
  const versionId = res.rows[0].id
  if (opts.setAsCurrent ?? status === 'published') {
    await query('UPDATE products SET current_version_id = $1 WHERE id = $2', [versionId, productId])
  }
  return versionId
}

export async function createTestOrder(
  buyerId: string,
  productId: string,
  opts: Partial<{
    amount: number
    status: string
    stripePaymentIntentId: string | null
    productVersionId: string | null
    stripeCheckoutSessionId: string | null
  }> = {}
): Promise<string> {
  // ?? would treat an explicit null the same as "not provided" and
  // substitute the default — tests need to pass null on purpose to
  // simulate an order with no linked Stripe payment.
  const stripePaymentIntentId = 'stripePaymentIntentId' in opts ? opts.stripePaymentIntentId : 'pi_test_123'
  const res = await query<{ id: string }>(
    `INSERT INTO orders (product_id, buyer_id, amount, license_type, status, stripe_payment_intent_id, product_version_id, stripe_checkout_session_id)
     VALUES ($1, $2, $3, 'commercial', $4, $5, $6, $7) RETURNING id`,
    [
      productId, buyerId, opts.amount ?? 20, opts.status ?? 'completed', stripePaymentIntentId,
      opts.productVersionId ?? null, opts.stripeCheckoutSessionId ?? null,
    ]
  )
  return res.rows[0].id
}

export async function createTestWithdrawal(
  sellerId: string,
  opts: Partial<{ requestedAmount: number; feeAmount: number; netAmount: number; status: string }> = {}
): Promise<string> {
  const requestedAmount = opts.requestedAmount ?? 100
  const feeAmount = opts.feeAmount ?? 10
  const netAmount = opts.netAmount ?? requestedAmount - feeAmount
  const res = await query<{ id: string }>(
    `INSERT INTO withdrawal_requests (seller_id, requested_amount, fee_amount, net_amount, status)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [sellerId, requestedAmount, feeAmount, netAmount, opts.status ?? 'pending']
  )
  return res.rows[0].id
}

export async function createTestCheckoutSession(
  userId: string,
  productId: string,
  opts: Partial<{ amount: number; licenseType: string; status: string; stripeSessionId: string; productVersionId: string | null }> = {}
): Promise<string> {
  const stripeSessionId = opts.stripeSessionId ?? `cs_test_${randomUUID()}`
  await query(
    `INSERT INTO checkout_sessions (stripe_session_id, user_id, product_id, license_type, amount, status, expires_at, product_version_id)
     VALUES ($1, $2, $3, $4, $5, $6, NOW() + interval '30 minutes', $7)`,
    [stripeSessionId, userId, productId, opts.licenseType ?? 'commercial', opts.amount ?? 20, opts.status ?? 'pending', opts.productVersionId ?? null]
  )
  return stripeSessionId
}

/** Removes everything created by the helpers above for these user ids, in FK-safe order. */
export async function cleanupTestUsers(userIds: string[]): Promise<void> {
  if (userIds.length === 0) return
  await query(
    `DELETE FROM checkout_sessions
     WHERE user_id = ANY($1) OR product_id IN (SELECT id FROM products WHERE seller_id = ANY($1))`,
    [userIds]
  )
  await query(
    `DELETE FROM orders
     WHERE buyer_id = ANY($1) OR product_id IN (SELECT id FROM products WHERE seller_id = ANY($1))`,
    [userIds]
  )
  await query(`DELETE FROM withdrawal_requests WHERE seller_id = ANY($1)`, [userIds])
  // Deleting the users cascades their products (seller_id), otps, and
  // audit_logs (admin_id) automatically.
  await query(`DELETE FROM users WHERE id = ANY($1)`, [userIds])
}
