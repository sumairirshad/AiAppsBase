import { describe, it, expect, afterEach, vi } from 'vitest'
import { isDatabaseConfigured, query } from './db'
import { createTestUser, createTestWithdrawal, cleanupTestUsers } from '@/test/db-test-helpers'
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
    createdUserIds.push(seller.id, admin.id)
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
    createdUserIds.push(seller.id, admin.id)
    const withdrawalId = await createTestWithdrawal(seller.id)

    const first = await processWithdrawalAction(withdrawalId, 'approve', admin.id, undefined)
    expect(first.kind).toBe('approved')

    const second = await processWithdrawalAction(withdrawalId, 'reject', admin.id, 'too late')
    expect(second.kind).toBe('already_processed')
    expect(transfersCreate).toHaveBeenCalledTimes(1)
  })
})
