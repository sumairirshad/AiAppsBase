import { describe, it, expect } from 'vitest'
import { generateOtpCode, getOtpExpiry, hashPassword, verifyPassword } from './auth'

describe('generateOtpCode', () => {
  it('always returns a 6-digit numeric string', () => {
    for (let i = 0; i < 50; i++) {
      const code = generateOtpCode()
      expect(code).toMatch(/^\d{6}$/)
    }
  })
})

describe('getOtpExpiry', () => {
  it('defaults to 10 minutes from now', () => {
    const before = Date.now()
    const expiry = getOtpExpiry()
    const after = Date.now()
    expect(expiry.getTime()).toBeGreaterThanOrEqual(before + 10 * 60 * 1000)
    expect(expiry.getTime()).toBeLessThanOrEqual(after + 10 * 60 * 1000)
  })
})

describe('hashPassword / verifyPassword', () => {
  it('round-trips a password and rejects the wrong one', async () => {
    const hash = await hashPassword('correct horse battery staple')
    expect(await verifyPassword('correct horse battery staple', hash)).toBe(true)
    expect(await verifyPassword('wrong password', hash)).toBe(false)
  })

  it('never stores the password in plaintext', async () => {
    const hash = await hashPassword('correct horse battery staple')
    expect(hash).not.toContain('correct horse battery staple')
  })
})
