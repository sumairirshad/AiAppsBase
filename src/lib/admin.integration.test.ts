import { describe, it, expect, afterEach, vi } from 'vitest'
import { isDatabaseConfigured, query } from './db'
import { createTestUser, cleanupTestUsers } from '@/test/db-test-helpers'
import { encodeSessionValue } from './session-token'

let currentSessionCookie: string | undefined

vi.mock('next/headers', () => ({
  cookies: () => ({
    get: (name: string) =>
      name === 'session_user_id' && currentSessionCookie ? { value: currentSessionCookie } : undefined,
    set: () => {},
    delete: () => {},
  }),
}))

import { requireAdmin, isAdminGuardError, logAdminAction } from './admin'

describe.skipIf(!isDatabaseConfigured())('requireAdmin', () => {
  const createdUserIds: string[] = []

  afterEach(async () => {
    currentSessionCookie = undefined
    await cleanupTestUsers(createdUserIds.splice(0))
  })

  it('authorizes an admin and returns their identity', async () => {
    const admin = await createTestUser({ role: 'admin' })
    createdUserIds.push(admin.id)
    currentSessionCookie = encodeSessionValue(admin.id, 0)

    const guard = await requireAdmin()
    expect(isAdminGuardError(guard)).toBe(false)
    if (!isAdminGuardError(guard)) expect(guard.id).toBe(admin.id)
  })

  it('forbids a signed-in user who is not an admin', async () => {
    const buyer = await createTestUser({ role: 'buyer' })
    createdUserIds.push(buyer.id)
    currentSessionCookie = encodeSessionValue(buyer.id, 0)

    const guard = await requireAdmin()
    expect(isAdminGuardError(guard)).toBe(true)
    if (isAdminGuardError(guard)) expect(guard.status).toBe(403)
  })

  it('rejects a cookie signed for a session_version the account no longer has', async () => {
    const admin = await createTestUser({ role: 'admin', sessionVersion: 1 })
    createdUserIds.push(admin.id)
    // Simulates a cookie issued before the account's password was changed
    // (which bumps session_version) — it must stop authenticating.
    currentSessionCookie = encodeSessionValue(admin.id, 0)

    const guard = await requireAdmin()
    expect(isAdminGuardError(guard)).toBe(true)
    if (isAdminGuardError(guard)) expect(guard.status).toBe(401)
  })

  it('rejects when there is no session at all', async () => {
    currentSessionCookie = undefined
    const guard = await requireAdmin()
    expect(isAdminGuardError(guard)).toBe(true)
    if (isAdminGuardError(guard)) expect(guard.status).toBe(401)
  })
})

describe.skipIf(!isDatabaseConfigured())('logAdminAction', () => {
  const createdUserIds: string[] = []

  afterEach(async () => {
    await cleanupTestUsers(createdUserIds.splice(0))
  })

  it('writes an audit log row with the given fields', async () => {
    const admin = await createTestUser({ role: 'admin' })
    createdUserIds.push(admin.id)

    await logAdminAction({
      adminId: admin.id,
      action: 'test.action',
      targetType: 'user',
      targetId: admin.id,
      reason: 'because this is a test',
      previousValue: { a: 1 },
      newValue: { a: 2 },
      ipAddress: '127.0.0.1',
    })

    const row = await query<{ action: string; reason: string }>(
      'SELECT action, reason FROM audit_logs WHERE admin_id = $1',
      [admin.id]
    )
    expect(row.rowCount).toBe(1)
    expect(row.rows[0].action).toBe('test.action')
    expect(row.rows[0].reason).toBe('because this is a test')
  })

  it('is best-effort — a failing insert never throws', async () => {
    await expect(
      logAdminAction({
        adminId: 'not-a-valid-uuid',
        action: 'test.action',
        targetType: 'user',
        targetId: 'whatever',
        reason: 'because this is a test',
      })
    ).resolves.toBeUndefined()
  })
})
