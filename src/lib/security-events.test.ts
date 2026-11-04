import { describe, it, expect, beforeEach, vi } from 'vitest'

const queryMock = vi.fn()
vi.mock('@/lib/db', () => ({ query: (...args: unknown[]) => queryMock(...args) }))

import { logSecurityEvent } from './security-events'

beforeEach(() => {
  queryMock.mockReset()
})

describe('logSecurityEvent', () => {
  it('inserts a row with the given fields', async () => {
    queryMock.mockResolvedValue({ rowCount: 1 })

    await logSecurityEvent({
      userId: 'user-1', eventType: 'login_failed', ipAddress: '1.2.3.4', userAgent: 'test-agent', details: 'Attempt 1 of 5',
    })

    expect(queryMock).toHaveBeenCalledTimes(1)
    const [sql, params] = queryMock.mock.calls[0]
    expect(sql).toMatch(/INSERT INTO security_events/)
    expect(params).toEqual(['user-1', 'login_failed', '1.2.3.4', 'test-agent', 'Attempt 1 of 5'])
  })

  it('never throws when the insert fails — logging must not block the underlying action', async () => {
    queryMock.mockRejectedValue(new Error('db down'))

    await expect(
      logSecurityEvent({ userId: 'user-1', eventType: 'password_changed', ipAddress: null, userAgent: null })
    ).resolves.toBeUndefined()
  })
})
