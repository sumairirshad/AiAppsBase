import { describe, it, expect, afterEach } from 'vitest'
import { isDatabaseConfigured } from './db'
import {
  createTestUser, createTestProduct, createTestProductVersion, createTestOrder, cleanupTestUsers,
} from '@/test/db-test-helpers'
import { reserveProductVersion, finalizeProductVersion } from './product-versions'
import { getUnreadNotificationCount, listBuyerNotifications, markAllNotificationsRead, markNotificationRead } from './notifications'

describe.skipIf(!isDatabaseConfigured())('notifications (integration)', () => {
  const createdUserIds: string[] = []
  afterEach(async () => {
    await cleanupTestUsers(createdUserIds.splice(0))
  })

  async function publishNotifyingVersion(productId: string, sellerId: string, version: string, releaseNotes: string | null) {
    const reserved = await reserveProductVersion(productId, sellerId, version, 'upload', releaseNotes, true)
    if (!reserved.ok) throw new Error('unreachable')
    await finalizeProductVersion(reserved.versionId, productId, {
      remotePath: `/remote/${version}.zip`, originalName: `${version}.zip`, sizeBytes: 1, sha256: 'x',
    })
    return reserved.versionId
  }

  it('lists a notification with product name, old/new version, release notes, and link', async () => {
    const seller = await createTestUser({ role: 'seller' })
    const buyer = await createTestUser({ role: 'buyer' })
    createdUserIds.push(seller.id, buyer.id)
    const productId = await createTestProduct(seller.id, { price: 0 })
    const v1 = await createTestProductVersion(productId, seller.id, { version: '1.0.0' })
    await createTestOrder(buyer.id, productId, { productVersionId: v1, amount: 0 })

    await publishNotifyingVersion(productId, seller.id, '1.1.0', 'Fixed the login bug.')

    const notifications = await listBuyerNotifications(buyer.id)
    expect(notifications).toHaveLength(1)
    const n = notifications[0]
    expect(n.productId).toBe(productId)
    expect(n.newVersion).toBe('1.1.0')
    expect(n.previousVersion).toBe('1.0.0')
    expect(n.releaseNotes).toBe('Fixed the login bug.')
    expect(n.linkUrl).toBe(`/product/${productId}`)
    expect(n.read).toBe(false)
  })

  it('unread count and mark-as-read are scoped correctly and affect only the caller\'s own notification', async () => {
    const seller = await createTestUser({ role: 'seller' })
    const buyerA = await createTestUser({ role: 'buyer' })
    const buyerB = await createTestUser({ role: 'buyer' })
    createdUserIds.push(seller.id, buyerA.id, buyerB.id)
    const productId = await createTestProduct(seller.id, { price: 0 })
    const v1 = await createTestProductVersion(productId, seller.id, { version: '1.0.0' })
    await createTestOrder(buyerA.id, productId, { productVersionId: v1, amount: 0 })
    await createTestOrder(buyerB.id, productId, { productVersionId: v1, amount: 0 })

    await publishNotifyingVersion(productId, seller.id, '1.1.0', null)

    expect(await getUnreadNotificationCount(buyerA.id)).toBe(1)
    expect(await getUnreadNotificationCount(buyerB.id)).toBe(1)

    const [notifA] = await listBuyerNotifications(buyerA.id)
    const [notifB] = await listBuyerNotifications(buyerB.id)

    // Buyer A cannot mark Buyer B's notification as read by guessing its id.
    const crossBuyerAttempt = await markNotificationRead(buyerA.id, notifB.id)
    expect(crossBuyerAttempt).toBe(false)
    expect(await getUnreadNotificationCount(buyerB.id)).toBe(1)

    const ownAttempt = await markNotificationRead(buyerA.id, notifA.id)
    expect(ownAttempt).toBe(true)
    expect(await getUnreadNotificationCount(buyerA.id)).toBe(0)
    expect(await getUnreadNotificationCount(buyerB.id)).toBe(1) // untouched
  })

  it('markAllNotificationsRead clears every unread notification for that buyer only', async () => {
    const seller = await createTestUser({ role: 'seller' })
    const buyer = await createTestUser({ role: 'buyer' })
    createdUserIds.push(seller.id, buyer.id)
    const productA = await createTestProduct(seller.id, { price: 0 })
    const productB = await createTestProduct(seller.id, { price: 0 })
    const vA = await createTestProductVersion(productA, seller.id, { version: '1.0.0' })
    const vB = await createTestProductVersion(productB, seller.id, { version: '1.0.0' })
    await createTestOrder(buyer.id, productA, { productVersionId: vA, amount: 0 })
    await createTestOrder(buyer.id, productB, { productVersionId: vB, amount: 0 })

    await publishNotifyingVersion(productA, seller.id, '1.1.0', null)
    await publishNotifyingVersion(productB, seller.id, '1.1.0', null)

    expect(await getUnreadNotificationCount(buyer.id)).toBe(2)
    await markAllNotificationsRead(buyer.id)
    expect(await getUnreadNotificationCount(buyer.id)).toBe(0)
  })

  it('a buyer with no notifications gets an empty list and zero unread count', async () => {
    const buyer = await createTestUser({ role: 'buyer' })
    createdUserIds.push(buyer.id)
    expect(await listBuyerNotifications(buyer.id)).toEqual([])
    expect(await getUnreadNotificationCount(buyer.id)).toBe(0)
  })
})
