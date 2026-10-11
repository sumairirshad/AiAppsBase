import { describe, it, expect, afterEach, vi } from 'vitest'
import { isDatabaseConfigured, query } from './db'
import {
  createTestUser,
  createTestProduct,
  createTestCheckoutSession,
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
})
