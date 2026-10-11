import { describe, it, expect, afterEach, vi } from 'vitest'
import { isDatabaseConfigured, query } from './db'
import { createTestUser, createTestProduct, createTestOrder, cleanupTestUsers } from '@/test/db-test-helpers'
import { refundOrder } from './refunds'

const refundsCreate = vi.fn()
vi.mock('@/lib/stripe', () => ({
  stripe: { refunds: { create: (...args: unknown[]) => refundsCreate(...args) } },
}))

describe.skipIf(!isDatabaseConfigured())('refundOrder', () => {
  const createdUserIds: string[] = []

  afterEach(async () => {
    refundsCreate.mockReset()
    await cleanupTestUsers(createdUserIds.splice(0))
  })

  it('refunds a completed order exactly once', async () => {
    refundsCreate.mockResolvedValue({ id: 're_test_123' })

    const seller = await createTestUser({ role: 'seller' })
    const buyer = await createTestUser({ role: 'buyer' })
    createdUserIds.push(seller.id, buyer.id)
    const productId = await createTestProduct(seller.id)
    const orderId = await createTestOrder(buyer.id, productId, { stripePaymentIntentId: 'pi_test_abc' })

    const result = await refundOrder(orderId, 'buyer requested a refund')
    expect(result.kind).toBe('refunded')
    expect(refundsCreate).toHaveBeenCalledTimes(1)
    expect(refundsCreate).toHaveBeenCalledWith({ payment_intent: 'pi_test_abc' })

    const row = await query<{ status: string; refund_reason: string }>(
      'SELECT status, refund_reason FROM orders WHERE id = $1',
      [orderId]
    )
    expect(row.rows[0].status).toBe('refunded')
    expect(row.rows[0].refund_reason).toBe('buyer requested a refund')
  })

  it('never issues two Stripe refunds for concurrent refund attempts on the same order', async () => {
    refundsCreate.mockResolvedValue({ id: 're_test_456' })

    const seller = await createTestUser({ role: 'seller' })
    const buyer = await createTestUser({ role: 'buyer' })
    createdUserIds.push(seller.id, buyer.id)
    const productId = await createTestProduct(seller.id)
    const orderId = await createTestOrder(buyer.id, productId, { stripePaymentIntentId: 'pi_test_concurrent' })

    const [a, b] = await Promise.all([refundOrder(orderId, 'reason A'), refundOrder(orderId, 'reason B')])

    const kinds = [a.kind, b.kind].sort()
    expect(kinds).toEqual(['already_refunded', 'refunded'])
    expect(refundsCreate).toHaveBeenCalledTimes(1)
  })

  it('refuses to refund an order with no linked Stripe payment', async () => {
    const seller = await createTestUser({ role: 'seller' })
    const buyer = await createTestUser({ role: 'buyer' })
    createdUserIds.push(seller.id, buyer.id)
    const productId = await createTestProduct(seller.id)
    const orderId = await createTestOrder(buyer.id, productId, { stripePaymentIntentId: null })

    const result = await refundOrder(orderId, 'no payment intent on this order')
    expect(result.kind).toBe('no_payment_intent')
    expect(refundsCreate).not.toHaveBeenCalled()
  })
})
