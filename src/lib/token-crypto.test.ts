import { describe, it, expect, beforeAll } from 'vitest'
import { encryptToken, decryptToken } from './token-crypto'

beforeAll(() => {
  process.env.TOKEN_ENCRYPTION_KEY = 'test-key-not-for-production-use'
})

describe('encryptToken / decryptToken', () => {
  it('round-trips a plaintext value', () => {
    const secret = 'gho_abcdefghijklmnopqrstuvwxyz0123456789'
    const ciphertext = encryptToken(secret)
    expect(ciphertext).not.toContain(secret)
    expect(decryptToken(ciphertext)).toBe(secret)
  })

  it('produces different ciphertext for the same input each time (random IV)', () => {
    const secret = 'same-secret'
    expect(encryptToken(secret)).not.toBe(encryptToken(secret))
  })

  it('fails closed (returns null) on tampered ciphertext', () => {
    const ciphertext = encryptToken('a-secret-value')
    const tampered = ciphertext.slice(0, -4) + 'AAAA'
    expect(decryptToken(tampered)).toBeNull()
  })

  it('returns null for garbage input instead of throwing', () => {
    expect(decryptToken('not-a-valid-token')).toBeNull()
    expect(decryptToken(null)).toBeNull()
    expect(decryptToken(undefined)).toBeNull()
  })
})
