import { randomUUID } from 'crypto'
import { describe, it, expect, afterEach, vi } from 'vitest'
import { isDatabaseConfigured, query } from './db'
import {
  createTestUser,
  createTestProduct,
  createTestProductVersion,
  createTestCheckoutSession,
  createTestOrder,
  cleanupTestUsers,
} from '@/test/db-test-helpers'
import { computeLicensePrice } from './license-pricing'
import { completeCheckoutSession } from './orders'

vi.mock('@/lib/email', () => ({ sendOrderReceiptEmail: vi.fn() }))

describe.skipIf(!isDatabaseConfigured())('completeCheckoutSession', () => {
  const createdUserIds: string[] = []

  afterEach(async () => {
    await cleanupTestUsers(createdUserIds.splice(0))
  })

  it('creates the order with the tier-adjusted amount, not the product base price', async () => {
    const seller = await createTestUser({ role: 'seller' })
    const buyer = await createTestUser({ role: 'buyer' })
    createdUserIds.push(seller.id, buyer.id)
    const productId = await createTestProduct(seller.id, { price: 40 })

    const tierAmount = computeLicensePrice(40, 'extended')
    expect(tierAmount).toBe(100)

    const stripeSessionId = await createTestCheckoutSession(buyer.id, productId, {
      amount: tierAmount,
      licenseType: 'extended',
    })

    await completeCheckoutSession(stripeSessionId, 'pi_test_order')

    const order = await query<{ amount: string; license_type: string; stripe_payment_intent_id: string }>(
      'SELECT amount, license_type, stripe_payment_intent_id FROM orders WHERE buyer_id = $1 AND product_id = $2',
      [buyer.id, productId]
    )
    expect(order.rowCount).toBe(1)
    expect(Number(order.rows[0].amount)).toBe(100)
    expect(order.rows[0].license_type).toBe('extended')
    expect(order.rows[0].stripe_payment_intent_id).toBe('pi_test_order')

    const session = await query<{ status: string }>(
      'SELECT status FROM checkout_sessions WHERE stripe_session_id = $1',
      [stripeSessionId]
    )
    expect(session.rows[0].status).toBe('completed')
  })

  it('is idempotent — calling it twice for the same session creates only one order', async () => {
    const seller = await createTestUser({ role: 'seller' })
    const buyer = await createTestUser({ role: 'buyer' })
    createdUserIds.push(seller.id, buyer.id)
    const productId = await createTestProduct(seller.id, { price: 40 })
    const stripeSessionId = await createTestCheckoutSession(buyer.id, productId, { amount: 40 })

    await completeCheckoutSession(stripeSessionId, 'pi_test_dup')
    await completeCheckoutSession(stripeSessionId, 'pi_test_dup')

    const orders = await query('SELECT id FROM orders WHERE buyer_id = $1 AND product_id = $2', [buyer.id, productId])
    expect(orders.rowCount).toBe(1)
  })

  it('fulfills every product in a cart-wide session sharing one stripe_session_id', async () => {
    const seller = await createTestUser({ role: 'seller' })
    const buyer = await createTestUser({ role: 'buyer' })
    createdUserIds.push(seller.id, buyer.id)
    const productA = await createTestProduct(seller.id, { price: 20 })
    const productB = await createTestProduct(seller.id, { price: 30 })

    const stripeSessionId = `cs_test_${randomUUID()}`
    await createTestCheckoutSession(buyer.id, productA, { amount: 20, stripeSessionId })
    await createTestCheckoutSession(buyer.id, productB, { amount: 30, stripeSessionId })

    await completeCheckoutSession(stripeSessionId, 'pi_test_cart')

    const orders = await query<{ product_id: string; amount: string }>(
      'SELECT product_id, amount FROM orders WHERE buyer_id = $1 ORDER BY amount',
      [buyer.id]
    )
    expect(orders.rowCount).toBe(2)
    expect(orders.rows.map((r) => r.product_id).sort()).toEqual([productA, productB].sort())

    const sessions = await query<{ status: string }>(
      'SELECT status FROM checkout_sessions WHERE stripe_session_id = $1',
      [stripeSessionId]
    )
    expect(sessions.rowCount).toBe(2)
    expect(sessions.rows.every((r) => r.status === 'completed')).toBe(true)
  })

  it('binds the order to the version snapshotted on the checkout session, not the product\'s current version', async () => {
    const seller = await createTestUser({ role: 'seller' })
    const buyer = await createTestUser({ role: 'buyer' })
    createdUserIds.push(seller.id, buyer.id)
    const productId = await createTestProduct(seller.id, { price: 20 })
    const v1 = await createTestProductVersion(productId, seller.id, { version: '1.0.0' })

    const stripeSessionId = await createTestCheckoutSession(buyer.id, productId, { amount: 20, productVersionId: v1 })

    // Seller publishes v2 while the buyer's checkout is still in flight.
    await createTestProductVersion(productId, seller.id, { version: '2.0.0' })

    await completeCheckoutSession(stripeSessionId, 'pi_test_version_snapshot')

    const order = await query<{ product_version_id: string }>(
      'SELECT product_version_id FROM orders WHERE buyer_id = $1 AND product_id = $2',
      [buyer.id, productId]
    )
    expect(order.rows[0].product_version_id).toBe(v1)
  })

  it('a buyer can repurchase after a new version ships, and each order resolves to its own version', async () => {
    const seller = await createTestUser({ role: 'seller' })
    const buyer = await createTestUser({ role: 'buyer' })
    createdUserIds.push(seller.id, buyer.id)
    const productId = await createTestProduct(seller.id, { price: 20 })
    const v1 = await createTestProductVersion(productId, seller.id, { version: '1.0.0' })

    const firstOrderId = await createTestOrder(buyer.id, productId, { productVersionId: v1, amount: 20 })

    const v2 = await createTestProductVersion(productId, seller.id, { version: '2.0.0' })
    const secondSession = await createTestCheckoutSession(buyer.id, productId, { amount: 20, productVersionId: v2 })
    await completeCheckoutSession(secondSession, 'pi_test_repurchase')

    const orders = await query<{ id: string; product_version_id: string }>(
      'SELECT id, product_version_id FROM orders WHERE buyer_id = $1 AND product_id = $2 ORDER BY created_at',
      [buyer.id, productId]
    )
    expect(orders.rowCount).toBe(2)
    expect(orders.rows.find((o) => o.id === firstOrderId)?.product_version_id).toBe(v1)
    expect(orders.rows.find((o) => o.id !== firstOrderId)?.product_version_id).toBe(v2)
  })

  it('does not create a second order for the exact same (buyer, product, version) even via two different sessions', async () => {
    const seller = await createTestUser({ role: 'seller' })
    const buyer = await createTestUser({ role: 'buyer' })
    createdUserIds.push(seller.id, buyer.id)
    const productId = await createTestProduct(seller.id, { price: 20 })
    const v1 = await createTestProductVersion(productId, seller.id, { version: '1.0.0' })

    const sessionA = await createTestCheckoutSession(buyer.id, productId, { amount: 20, productVersionId: v1 })
    await completeCheckoutSession(sessionA, 'pi_test_dup_version_a')

    const sessionB = await createTestCheckoutSession(buyer.id, productId, { amount: 20, productVersionId: v1 })
    await completeCheckoutSession(sessionB, 'pi_test_dup_version_b')

    const orders = await query('SELECT id FROM orders WHERE buyer_id = $1 AND product_id = $2', [buyer.id, productId])
    expect(orders.rowCount).toBe(1)
  })
})
