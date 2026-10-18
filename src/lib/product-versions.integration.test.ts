import { describe, it, expect, afterEach } from 'vitest'
import { isDatabaseConfigured, query } from './db'
import {
  createTestUser, createTestProduct, createTestProductVersion, createTestOrder, cleanupTestUsers,
} from '@/test/db-test-helpers'
import {
  reserveProductVersion, finalizeProductVersion, failProductVersion, listProductVersions, resolveOrderDeliverable,
  normalizeVersionString,
} from './product-versions'

describe('normalizeVersionString', () => {
  it('trims and accepts a normal version string', () => {
    expect(normalizeVersionString('  1.2.0  ')).toEqual({ ok: true, version: '1.2.0' })
  })
  it('rejects empty input', () => {
    expect(normalizeVersionString('   ').ok).toBe(false)
  })
  it('rejects a version containing whitespace or a slash', () => {
    expect(normalizeVersionString('1.0 beta').ok).toBe(false)
    expect(normalizeVersionString('v1/0').ok).toBe(false)
  })
  it('rejects an overly long version string', () => {
    expect(normalizeVersionString('x'.repeat(51)).ok).toBe(false)
  })
})

describe.skipIf(!isDatabaseConfigured())('product-versions (integration)', () => {
  const createdUserIds: string[] = []
  afterEach(async () => {
    await cleanupTestUsers(createdUserIds.splice(0))
  })

  it('publishing the first version succeeds and becomes current', async () => {
    const seller = await createTestUser({ role: 'seller' })
    createdUserIds.push(seller.id)
    const productId = await createTestProduct(seller.id)

    const reserved = await reserveProductVersion(productId, seller.id, '1.0.0', 'upload', null, false)
    expect(reserved.ok).toBe(true)
    if (!reserved.ok) throw new Error('unreachable')

    await finalizeProductVersion(reserved.versionId, productId, {
      remotePath: '/remote/v1.zip', originalName: 'v1.zip', sizeBytes: 100, sha256: 'abc',
    })

    const productRes = await query<{ current_version_id: string; version: string }>(
      'SELECT current_version_id, version FROM products WHERE id = $1',
      [productId]
    )
    expect(productRes.rows[0].current_version_id).toBe(reserved.versionId)
    expect(productRes.rows[0].version).toBe('1.0.0')

    const history = await listProductVersions(productId, seller.id)
    expect(history).toHaveLength(1)
    expect(history[0].status).toBe('published')
    expect(history[0].isCurrent).toBe(true)
  })

  it('rejects publishing a duplicate version identifier for the same product', async () => {
    const seller = await createTestUser({ role: 'seller' })
    createdUserIds.push(seller.id)
    const productId = await createTestProduct(seller.id)
    await createTestProductVersion(productId, seller.id, { version: '1.0.0' })

    const reserved = await reserveProductVersion(productId, seller.id, '1.0.0', 'upload', null, false)
    expect(reserved.ok).toBe(false)
    if (reserved.ok) throw new Error('unreachable')
    expect(reserved.message).toMatch(/already exists/i)
  })

  it('a new unique version is accepted even when an older one already exists', async () => {
    const seller = await createTestUser({ role: 'seller' })
    createdUserIds.push(seller.id)
    const productId = await createTestProduct(seller.id)
    await createTestProductVersion(productId, seller.id, { version: '1.0.0' })

    const reserved = await reserveProductVersion(productId, seller.id, '1.1.0', 'upload', null, false)
    expect(reserved.ok).toBe(true)
  })

  it('concurrent publish attempts for the SAME version only let one through', async () => {
    const seller = await createTestUser({ role: 'seller' })
    createdUserIds.push(seller.id)
    const productId = await createTestProduct(seller.id)

    const results = await Promise.all([
      reserveProductVersion(productId, seller.id, '2.0.0', 'upload', null, false),
      reserveProductVersion(productId, seller.id, '2.0.0', 'upload', null, false),
      reserveProductVersion(productId, seller.id, '2.0.0', 'upload', null, false),
    ])
    const succeeded = results.filter((r) => r.ok)
    const failed = results.filter((r) => !r.ok)
    expect(succeeded).toHaveLength(1)
    expect(failed).toHaveLength(2)
  })

  it('concurrent publish attempts for DIFFERENT versions of the same product all succeed', async () => {
    const seller = await createTestUser({ role: 'seller' })
    createdUserIds.push(seller.id)
    const productId = await createTestProduct(seller.id)

    const results = await Promise.all([
      reserveProductVersion(productId, seller.id, '3.0.0', 'upload', null, false),
      reserveProductVersion(productId, seller.id, '3.1.0', 'upload', null, false),
      reserveProductVersion(productId, seller.id, '3.2.0', 'upload', null, false),
    ])
    expect(results.every((r) => r.ok)).toBe(true)
  })

  it('a failed publish does not affect the product\'s current release', async () => {
    const seller = await createTestUser({ role: 'seller' })
    createdUserIds.push(seller.id)
    const productId = await createTestProduct(seller.id)
    const v1 = await createTestProductVersion(productId, seller.id, { version: '1.0.0' })

    const reserved = await reserveProductVersion(productId, seller.id, '1.1.0', 'upload', null, false)
    expect(reserved.ok).toBe(true)
    if (!reserved.ok) throw new Error('unreachable')
    await failProductVersion(reserved.versionId)

    const productRes = await query<{ current_version_id: string }>('SELECT current_version_id FROM products WHERE id = $1', [productId])
    expect(productRes.rows[0].current_version_id).toBe(v1)
  })

  it('after a failed publish, the same version string can be retried and succeed', async () => {
    const seller = await createTestUser({ role: 'seller' })
    createdUserIds.push(seller.id)
    const productId = await createTestProduct(seller.id)

    const first = await reserveProductVersion(productId, seller.id, '1.0.0', 'upload', null, false)
    if (!first.ok) throw new Error('unreachable')
    await failProductVersion(first.versionId)

    const retry = await reserveProductVersion(productId, seller.id, '1.0.0', 'upload', null, false)
    expect(retry.ok).toBe(true)
  })

  it('old deliverables remain accessible after a new version is published (orders keep their own version)', async () => {
    const seller = await createTestUser({ role: 'seller' })
    const buyer = await createTestUser({ role: 'buyer' })
    createdUserIds.push(seller.id, buyer.id)
    const productId = await createTestProduct(seller.id)
    const v1 = await createTestProductVersion(productId, seller.id, {
      version: '1.0.0', deliverableRemotePath: '/remote/v1.zip',
    })
    const orderId = await createTestOrder(buyer.id, productId, { productVersionId: v1 })

    // Seller publishes v2 — the product's current version moves on.
    const v2 = await createTestProductVersion(productId, seller.id, {
      version: '2.0.0', deliverableRemotePath: '/remote/v2.zip',
    })

    const orderRes = await query<{ product_version_id: string }>('SELECT product_version_id FROM orders WHERE id = $1', [orderId])
    expect(orderRes.rows[0].product_version_id).toBe(v1)

    const resolved = await resolveOrderDeliverable(productId, orderRes.rows[0].product_version_id)
    expect(resolved?.deliverableRemotePath).toBe('/remote/v1.zip')

    const productRes = await query<{ current_version_id: string }>('SELECT current_version_id FROM products WHERE id = $1', [productId])
    expect(productRes.rows[0].current_version_id).toBe(v2)
  })

  it('notifies previous buyers only when notify_buyers is true, and never an unpublished version', async () => {
    const seller = await createTestUser({ role: 'seller' })
    const buyer = await createTestUser({ role: 'buyer' })
    createdUserIds.push(seller.id, buyer.id)
    const productId = await createTestProduct(seller.id, { price: 0 })
    const v1 = await createTestProductVersion(productId, seller.id, { version: '1.0.0' })
    await createTestOrder(buyer.id, productId, { productVersionId: v1, amount: 0 })

    const reserved = await reserveProductVersion(productId, seller.id, '1.1.0', 'upload', 'Bug fixes', true)
    if (!reserved.ok) throw new Error('unreachable')
    await finalizeProductVersion(reserved.versionId, productId, {
      remotePath: '/remote/v2.zip', originalName: 'v2.zip', sizeBytes: 10, sha256: 'x',
    })

    const notifs = await query(
      `SELECT buyer_id, product_version_id, title FROM buyer_notifications WHERE product_id = $1`,
      [productId]
    )
    expect(notifs.rowCount).toBe(1)
    expect(notifs.rows[0].buyer_id).toBe(buyer.id)
    expect(notifs.rows[0].product_version_id).toBe(reserved.versionId)
  })

  it('does not notify anyone when notify_buyers is false', async () => {
    const seller = await createTestUser({ role: 'seller' })
    const buyer = await createTestUser({ role: 'buyer' })
    createdUserIds.push(seller.id, buyer.id)
    const productId = await createTestProduct(seller.id, { price: 0 })
    const v1 = await createTestProductVersion(productId, seller.id, { version: '1.0.0' })
    await createTestOrder(buyer.id, productId, { productVersionId: v1, amount: 0 })

    const reserved = await reserveProductVersion(productId, seller.id, '1.1.0', 'upload', null, false)
    if (!reserved.ok) throw new Error('unreachable')
    await finalizeProductVersion(reserved.versionId, productId, {
      remotePath: '/remote/v2.zip', originalName: 'v2.zip', sizeBytes: 10, sha256: 'x',
    })

    const notifs = await query(`SELECT 1 FROM buyer_notifications WHERE product_id = $1`, [productId])
    expect(notifs.rowCount).toBe(0)
  })

  it('does not treat a brand-new buyer of the new version as a "previous buyer" needing notification', async () => {
    const seller = await createTestUser({ role: 'seller' })
    const newBuyer = await createTestUser({ role: 'buyer' })
    createdUserIds.push(seller.id, newBuyer.id)
    const productId = await createTestProduct(seller.id, { price: 0 })
    // No prior purchases at all for this product yet.

    const reserved = await reserveProductVersion(productId, seller.id, '1.0.0', 'upload', null, true)
    if (!reserved.ok) throw new Error('unreachable')
    await finalizeProductVersion(reserved.versionId, productId, {
      remotePath: '/remote/v1.zip', originalName: 'v1.zip', sizeBytes: 10, sha256: 'x',
    })

    const notifs = await query(`SELECT 1 FROM buyer_notifications WHERE product_id = $1`, [productId])
    expect(notifs.rowCount).toBe(0) // nobody owned a PREVIOUS version, so nobody is notified
  })

  it('re-running finalize for the same version is idempotent and never duplicates notifications', async () => {
    const seller = await createTestUser({ role: 'seller' })
    const buyer = await createTestUser({ role: 'buyer' })
    createdUserIds.push(seller.id, buyer.id)
    const productId = await createTestProduct(seller.id, { price: 0 })
    const v1 = await createTestProductVersion(productId, seller.id, { version: '1.0.0' })
    await createTestOrder(buyer.id, productId, { productVersionId: v1, amount: 0 })

    const reserved = await reserveProductVersion(productId, seller.id, '1.1.0', 'upload', null, true)
    if (!reserved.ok) throw new Error('unreachable')

    const deliverable = { remotePath: '/remote/v2.zip', originalName: 'v2.zip', sizeBytes: 10, sha256: 'x' }
    await finalizeProductVersion(reserved.versionId, productId, deliverable)
    await finalizeProductVersion(reserved.versionId, productId, deliverable) // simulated retry

    const notifs = await query(`SELECT 1 FROM buyer_notifications WHERE product_id = $1 AND buyer_id = $2`, [productId, buyer.id])
    expect(notifs.rowCount).toBe(1)
  })
})
