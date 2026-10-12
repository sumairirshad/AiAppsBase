import { describe, it, expect, afterEach } from 'vitest'
import { isDatabaseConfigured, query } from './db'
import { createTestUser, createTestProduct, createTestOrder, cleanupTestUsers } from '@/test/db-test-helpers'
import { canBuyerReview } from './products'

describe.skipIf(!isDatabaseConfigured())('canBuyerReview', () => {
  const createdUserIds: string[] = []

  afterEach(async () => {
    await cleanupTestUsers(createdUserIds.splice(0))
  })

  it('is false for someone who never purchased the product', async () => {
    const seller = await createTestUser({ role: 'seller' })
    const buyer = await createTestUser({ role: 'buyer' })
    createdUserIds.push(seller.id, buyer.id)
    const productId = await createTestProduct(seller.id)

    expect(await canBuyerReview(buyer.id, productId)).toBe(false)
  })

  it('is true for a buyer with a completed order who has not reviewed yet', async () => {
    const seller = await createTestUser({ role: 'seller' })
    const buyer = await createTestUser({ role: 'buyer' })
    createdUserIds.push(seller.id, buyer.id)
    const productId = await createTestProduct(seller.id)
    await createTestOrder(buyer.id, productId, { status: 'completed' })

    expect(await canBuyerReview(buyer.id, productId)).toBe(true)
  })

  it('is false once the buyer has already reviewed the product', async () => {
    const seller = await createTestUser({ role: 'seller' })
    const buyer = await createTestUser({ role: 'buyer' })
    createdUserIds.push(seller.id, buyer.id)
    const productId = await createTestProduct(seller.id)
    await createTestOrder(buyer.id, productId, { status: 'completed' })

    await query(
      `INSERT INTO reviews (product_id, user_id, rating, code_quality, design, documentation, value_for_money, comment, verified)
       VALUES ($1, $2, 5, 5, 5, 5, 5, 'Great product', true)`,
      [productId, buyer.id]
    )

    expect(await canBuyerReview(buyer.id, productId)).toBe(false)
  })

  it('is false for a refunded order (not a completed purchase anymore)', async () => {
    const seller = await createTestUser({ role: 'seller' })
    const buyer = await createTestUser({ role: 'buyer' })
    createdUserIds.push(seller.id, buyer.id)
    const productId = await createTestProduct(seller.id)
    await createTestOrder(buyer.id, productId, { status: 'refunded' })

    expect(await canBuyerReview(buyer.id, productId)).toBe(false)
  })
})
