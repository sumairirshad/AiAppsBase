import { describe, it, expect, beforeEach, vi } from 'vitest'

const queryMock = vi.fn()
vi.mock('@/lib/db', () => ({ query: (...args: unknown[]) => queryMock(...args) }))

const balanceTransactionsListMock = vi.fn()
vi.mock('@/lib/stripe', () => ({
  stripe: { balanceTransactions: { list: (...args: unknown[]) => balanceTransactionsListMock(...args) } },
}))

import { handleConnectPayoutPaid, handleConnectPayoutFailed } from './connect-payouts'

beforeEach(() => {
  queryMock.mockReset()
  balanceTransactionsListMock.mockReset()
})

describe('handleConnectPayoutPaid', () => {
  it('marks every withdrawal_request whose transfer id contributed to the payout as paid', async () => {
    balanceTransactionsListMock.mockReturnValue([
      { type: 'transfer', source: 'tr_1' },
      { type: 'transfer', source: { id: 'tr_2' } },
      { type: 'payout', source: 'po_unrelated' },
    ])
    queryMock.mockResolvedValue({ rowCount: 2 })

    await handleConnectPayoutPaid('po_1', 'acct_1')

    expect(balanceTransactionsListMock).toHaveBeenCalledWith(
      { payout: 'po_1', type: 'transfer', limit: 100 },
      { stripeAccount: 'acct_1' }
    )
    expect(queryMock).toHaveBeenCalledTimes(1)
    const [sql, params] = queryMock.mock.calls[0]
    expect(sql).toMatch(/SET status = 'paid'/)
    expect(params[1]).toEqual(['tr_1', 'tr_2'])
  })

  it('does nothing when the payout included no transfers (nothing to reconcile)', async () => {
    balanceTransactionsListMock.mockReturnValue([])

    await handleConnectPayoutPaid('po_1', 'acct_1')

    expect(queryMock).not.toHaveBeenCalled()
  })
})

describe('handleConnectPayoutFailed', () => {
  it('marks matching withdrawal_requests payout_failed with the failure reason', async () => {
    balanceTransactionsListMock.mockReturnValue([{ type: 'transfer', source: 'tr_1' }])
    queryMock.mockResolvedValue({ rowCount: 1 })

    await handleConnectPayoutFailed('po_2', 'acct_1', 'insufficient_funds')

    const [sql, params] = queryMock.mock.calls[0]
    expect(sql).toMatch(/SET status = 'payout_failed'/)
    expect(params).toEqual(['po_2', 'insufficient_funds', ['tr_1']])
  })
})
