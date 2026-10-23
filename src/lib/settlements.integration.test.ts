import { describe, it, expect, afterEach, vi } from 'vitest'
import { isDatabaseConfigured, query } from './db'
import { createTestUser, createTestProduct, createTestOrder, createTestWithdrawal, cleanupTestUsers } from '@/test/db-test-helpers'
import { processWithdrawalAction } from './settlements'

const accountsRetrieve = vi.fn()
const transfersCreate = vi.fn()
vi.mock('@/lib/stripe', () => ({
  stripe: {
    accounts: { retrieve: (...args: unknown[]) => accountsRetrieve(...args) },
    transfers: { create: (...args: unknown[]) => transfersCreate(...args) },
  },
}))

describe.skipIf(!isDatabaseConfigured())('processWithdrawalAction', () => {
  const createdUserIds: string[] = []

  afterEach(async () => {
    accountsRetrieve.mockReset()
    transfersCreate.mockReset()
    await cleanupTestUsers(createdUserIds.splice(0))
  })

  it('never transfers twice for concurrent approve calls on the same withdrawal', async () => {
    accountsRetrieve.mockResolvedValue({ payouts_enabled: true })
    transfersCreate.mockResolvedValue({ id: 'tr_test_123' })

    const seller = await createTestUser({ role: 'seller', stripeAccountId: 'acct_test_123', stripePayoutsEnabled: true })
    const admin = await createTestUser({ role: 'admin' })
    const buyer = await createTestUser({ role: 'buyer' })
    createdUserIds.push(seller.id, admin.id, buyer.id)
    const product = await createTestProduct(seller.id, { price: 100 })
    await createTestOrder(buyer.id, product, { amount: 100 })
    const withdrawalId = await createTestWithdrawal(seller.id, { requestedAmount: 100, feeAmount: 10, netAmount: 90 })

    const [a, b] = await Promise.all([
      processWithdrawalAction(withdrawalId, 'approve', admin.id, undefined),
      processWithdrawalAction(withdrawalId, 'approve', admin.id, undefined),
    ])

    const kinds = [a.kind, b.kind].sort()
    expect(kinds).toEqual(['already_processed', 'approved'])
    expect(transfersCreate).toHaveBeenCalledTimes(1)
    expect(transfersCreate).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 9000, destination: 'acct_test_123' })
    )

    const row = await query<{ status: string }>('SELECT status FROM withdrawal_requests WHERE id = $1', [withdrawalId])
    expect(row.rows[0].status).toBe('approved')
  })

  it('rejects a withdrawal without touching Stripe', async () => {
    const seller = await createTestUser({ role: 'seller', stripeAccountId: 'acct_test_456', stripePayoutsEnabled: true })
    const admin = await createTestUser({ role: 'admin' })
    createdUserIds.push(seller.id, admin.id)
    const withdrawalId = await createTestWithdrawal(seller.id)

    const result = await processWithdrawalAction(withdrawalId, 'reject', admin.id, 'suspicious activity')
    expect(result.kind).toBe('rejected')
    expect(transfersCreate).not.toHaveBeenCalled()

    const row = await query<{ status: string; rejection_reason: string }>(
      'SELECT status, rejection_reason FROM withdrawal_requests WHERE id = $1',
      [withdrawalId]
    )
    expect(row.rows[0].status).toBe('rejected')
    expect(row.rows[0].rejection_reason).toBe('suspicious activity')
  })

  it('will not approve or reject an already-approved withdrawal', async () => {
    accountsRetrieve.mockResolvedValue({ payouts_enabled: true })
    transfersCreate.mockResolvedValue({ id: 'tr_test_789' })

    const seller = await createTestUser({ role: 'seller', stripeAccountId: 'acct_test_789', stripePayoutsEnabled: true })
    const admin = await createTestUser({ role: 'admin' })
    const buyer = await createTestUser({ role: 'buyer' })
    createdUserIds.push(seller.id, admin.id, buyer.id)
    const product = await createTestProduct(seller.id, { price: 100 })
    await createTestOrder(buyer.id, product, { amount: 100 })
    const withdrawalId = await createTestWithdrawal(seller.id)

    const first = await processWithdrawalAction(withdrawalId, 'approve', admin.id, undefined)
    expect(first.kind).toBe('approved')

    const second = await processWithdrawalAction(withdrawalId, 'reject', admin.id, 'too late')
    expect(second.kind).toBe('already_processed')
    expect(transfersCreate).toHaveBeenCalledTimes(1)
  })

  it('blocks approval, without transferring, when a refund since the request means the balance no longer covers it', async () => {
    accountsRetrieve.mockResolvedValue({ payouts_enabled: true })
    transfersCreate.mockResolvedValue({ id: 'tr_test_should_not_happen' })

    const seller = await createTestUser({ role: 'seller', stripeAccountId: 'acct_test_refund', stripePayoutsEnabled: true })
    const admin = await createTestUser({ role: 'admin' })
    const buyer = await createTestUser({ role: 'buyer' })
    createdUserIds.push(seller.id, admin.id, buyer.id)
    const product = await createTestProduct(seller.id, { price: 100 })
    const orderId = await createTestOrder(buyer.id, product, { amount: 100 })
    // Balance covers it at request time...
    const withdrawalId = await createTestWithdrawal(seller.id, { requestedAmount: 100, feeAmount: 10, netAmount: 90 })

    // ...but the order backing it is refunded before an admin approves.
    await query(`UPDATE orders SET status = 'refunded' WHERE id = $1`, [orderId])

    const result = await processWithdrawalAction(withdrawalId, 'approve', admin.id, undefined)
    expect(result.kind).toBe('insufficient_balance')
    expect(transfersCreate).not.toHaveBeenCalled()

    const row = await query<{ status: string }>('SELECT status FROM withdrawal_requests WHERE id = $1', [withdrawalId])
    expect(row.rows[0].status).toBe('pending')
  })

  it('excludes the withdrawal itself from "already locked by other requests", so a lone request is approved normally', async () => {
    accountsRetrieve.mockResolvedValue({ payouts_enabled: true })
    transfersCreate.mockResolvedValue({ id: 'tr_test_exact' })

    const seller = await createTestUser({ role: 'seller', stripeAccountId: 'acct_test_exact', stripePayoutsEnabled: true })
    const admin = await createTestUser({ role: 'admin' })
    const buyer = await createTestUser({ role: 'buyer' })
    createdUserIds.push(seller.id, admin.id, buyer.id)
    const product = await createTestProduct(seller.id, { price: 50 })
    await createTestOrder(buyer.id, product, { amount: 50 })
    // Request for exactly the full available balance -- would wrongly be
    // blocked if the withdrawal's own requested_amount were double-counted
    // against itself in the "locked by other requests" sum.
    const withdrawalId = await createTestWithdrawal(seller.id, { requestedAmount: 50, feeAmount: 5, netAmount: 45 })

    const result = await processWithdrawalAction(withdrawalId, 'approve', admin.id, undefined)
    expect(result.kind).toBe('approved')
  })
})
