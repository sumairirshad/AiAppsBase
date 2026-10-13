import { describe, it, expect, afterEach } from 'vitest'
import { isDatabaseConfigured, query } from './db'
import { createTestUser, cleanupTestUsers } from '@/test/db-test-helpers'
import { computeWithdrawalSplit, getPlatformFeePercent, setPlatformFeePercent } from './payouts'

describe.skipIf(!isDatabaseConfigured())('platform commission rate persistence', () => {
  const createdUserIds: string[] = []

  afterEach(async () => {
    await query(`DELETE FROM platform_settings WHERE key = 'commission_rate_percent'`)
    await cleanupTestUsers(createdUserIds.splice(0))
  })

  it('falls back to the env/default rate when nothing is persisted', async () => {
    const percent = await getPlatformFeePercent()
    const envRate = Number(process.env.PLATFORM_FEE_PERCENT)
    expect(percent).toBe(Number.isFinite(envRate) ? envRate : 10)
  })

  it('persists an admin-set rate and uses it afterward', async () => {
    const admin = await createTestUser({ role: 'admin' })
    createdUserIds.push(admin.id)

    await setPlatformFeePercent(15, admin.id)
    expect(await getPlatformFeePercent()).toBe(15)

    const { feeAmount, netAmount } = await computeWithdrawalSplit(100)
    expect(feeAmount).toBe(15)
    expect(netAmount).toBe(85)
  })

  it('clamps an out-of-range rate to [0, 100]', async () => {
    const admin = await createTestUser({ role: 'admin' })
    createdUserIds.push(admin.id)

    await setPlatformFeePercent(500, admin.id)
    expect(await getPlatformFeePercent()).toBe(100)
  })

  it('updating the rate again overwrites the previous value', async () => {
    const admin = await createTestUser({ role: 'admin' })
    createdUserIds.push(admin.id)

    await setPlatformFeePercent(12, admin.id)
    await setPlatformFeePercent(8, admin.id)
    expect(await getPlatformFeePercent()).toBe(8)
  })
})
