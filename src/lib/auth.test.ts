import { describe, it, expect } from 'vitest'
import { generateOtpCode, getOtpExpiry, hashPassword, validatePasswordStrength, verifyPassword } from './auth'

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

describe('validatePasswordStrength', () => {
  it('rejects passwords under 8 characters', () => {
    expect(validatePasswordStrength('abc123')).toMatch(/at least 8 characters/)
  })

  it('rejects passwords over 128 characters', () => {
    expect(validatePasswordStrength('a1'.repeat(65))).toMatch(/128 characters or fewer/)
  })

  it('rejects passwords with no letters', () => {
    expect(validatePasswordStrength('12345678')).toMatch(/at least one letter/)
  })

  it('rejects passwords with no numbers', () => {
    expect(validatePasswordStrength('abcdefgh')).toMatch(/at least one number/)
  })

  it('accepts a password with letters, numbers, and enough length', () => {
    expect(validatePasswordStrength('correcthorse1')).toBeNull()
  })
})
