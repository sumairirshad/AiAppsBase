import { describe, it, expect, afterEach } from 'vitest'
import { isDatabaseConfigured, query } from './db'
import { createTestUser, createTestProduct, createTestOrder, cleanupTestUsers } from '@/test/db-test-helpers'
import { handleStripeDisputeClosed, handleStripeDisputeCreated } from './disputes'

describe.skipIf(!isDatabaseConfigured())('stripe dispute policy (integration)', () => {
  const createdUserIds: string[] = []
  afterEach(async () => {
    await cleanupTestUsers(createdUserIds.splice(0))
  })

  it('opening a dispute moves a completed order to disputed and blocks it from being treated as completed', async () => {
    const seller = await createTestUser({ role: 'seller' })
    const buyer = await createTestUser({ role: 'buyer' })
    createdUserIds.push(seller.id, buyer.id)
    const productId = await createTestProduct(seller.id)
    const orderId = await createTestOrder(buyer.id, productId, { stripePaymentIntentId: 'pi_dispute_1' })

    await handleStripeDisputeCreated('pi_dispute_1', 'fraudulent')

    const res = await query<{ status: string; dispute_reason: string }>('SELECT status, dispute_reason FROM orders WHERE id = $1', [orderId])
    expect(res.rows[0].status).toBe('disputed')
    expect(res.rows[0].dispute_reason).toMatch(/chargeback opened/i)
  })

  it('a dispute the merchant WON restores the order to completed', async () => {
    const seller = await createTestUser({ role: 'seller' })
    const buyer = await createTestUser({ role: 'buyer' })
    createdUserIds.push(seller.id, buyer.id)
    const productId = await createTestProduct(seller.id)
    const orderId = await createTestOrder(buyer.id, productId, { stripePaymentIntentId: 'pi_dispute_2' })

    await handleStripeDisputeCreated('pi_dispute_2', null)
    await handleStripeDisputeClosed('pi_dispute_2', 'won')

    const res = await query<{ status: string; dispute_resolution: string }>(
      'SELECT status, dispute_resolution FROM orders WHERE id = $1', [orderId]
    )
    expect(res.rows[0].status).toBe('completed')
    expect(res.rows[0].dispute_resolution).toBe('rejected')
  })

  it('a dispute the merchant LOST marks the order refunded without calling Stripe refunds again', async () => {
    const seller = await createTestUser({ role: 'seller' })
    const buyer = await createTestUser({ role: 'buyer' })
    createdUserIds.push(seller.id, buyer.id)
    const productId = await createTestProduct(seller.id)
    const orderId = await createTestOrder(buyer.id, productId, { stripePaymentIntentId: 'pi_dispute_3' })

    await handleStripeDisputeCreated('pi_dispute_3', null)
    await handleStripeDisputeClosed('pi_dispute_3', 'lost')

    const res = await query<{ status: string; dispute_resolution: string }>(
      'SELECT status, dispute_resolution FROM orders WHERE id = $1', [orderId]
    )
    expect(res.rows[0].status).toBe('refunded')
    expect(res.rows[0].dispute_resolution).toBe('upheld')
  })

  it('is idempotent against the same event handler being invoked twice (webhook redelivery)', async () => {
    const seller = await createTestUser({ role: 'seller' })
    const buyer = await createTestUser({ role: 'buyer' })
    createdUserIds.push(seller.id, buyer.id)
    const productId = await createTestProduct(seller.id)
    const orderId = await createTestOrder(buyer.id, productId, { stripePaymentIntentId: 'pi_dispute_4' })

    await handleStripeDisputeCreated('pi_dispute_4', null)
    await handleStripeDisputeCreated('pi_dispute_4', null) // redelivered
    await handleStripeDisputeClosed('pi_dispute_4', 'lost')
    await handleStripeDisputeClosed('pi_dispute_4', 'lost') // redelivered

    const res = await query<{ status: string }>('SELECT status FROM orders WHERE id = $1', [orderId])
    expect(res.rows[0].status).toBe('refunded')
  })

  it('does nothing when no order matches the payment intent', async () => {
    await expect(handleStripeDisputeCreated('pi_does_not_exist', null)).resolves.toBeUndefined()
    await expect(handleStripeDisputeClosed('pi_does_not_exist', 'won')).resolves.toBeUndefined()
  })
})
