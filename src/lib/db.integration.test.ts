import { describe, it, expect, afterEach } from 'vitest'
import { isDatabaseConfigured, query, withTransaction } from './db'
import { createTestUser, cleanupTestUsers } from '@/test/db-test-helpers'

describe.skipIf(!isDatabaseConfigured())('withTransaction', () => {
  const createdUserIds: string[] = []

  afterEach(async () => {
    await cleanupTestUsers(createdUserIds.splice(0))
  })

  it('serializes concurrent SELECT ... FOR UPDATE on the same row', async () => {
    // This is the exact pattern settlement approval and withdrawal creation
    // rely on: without the row lock, two concurrent transactions both read
    // the same starting value and one write is lost. With it, the second
    // transaction's SELECT blocks until the first commits, so both
    // increments land.
    const { id: userId } = await createTestUser({ sessionVersion: 0 })
    createdUserIds.push(userId)

    const bumpVersion = () =>
      withTransaction(async (client) => {
        const res = await client.query<{ session_version: number }>(
          'SELECT session_version FROM users WHERE id = $1 FOR UPDATE',
          [userId]
        )
        const current = res.rows[0].session_version
        // Hold the lock for a moment so the two transactions can't help but
        // overlap if the lock isn't actually serializing them.
        await new Promise((resolve) => setTimeout(resolve, 50))
        await client.query('UPDATE users SET session_version = $1 WHERE id = $2', [current + 1, userId])
      })

    await Promise.all([bumpVersion(), bumpVersion()])

    const final = await query<{ session_version: number }>('SELECT session_version FROM users WHERE id = $1', [userId])
    expect(final.rows[0].session_version).toBe(2)
  })

  it('rolls back every write when the callback throws', async () => {
    const { id: userId } = await createTestUser({ sessionVersion: 0 })
    createdUserIds.push(userId)

    await expect(
      withTransaction(async (client) => {
        await client.query('UPDATE users SET session_version = 99 WHERE id = $1', [userId])
        throw new Error('boom')
      })
    ).rejects.toThrow('boom')

    const after = await query<{ session_version: number }>('SELECT session_version FROM users WHERE id = $1', [userId])
    expect(after.rows[0].session_version).toBe(0)
  })
})
