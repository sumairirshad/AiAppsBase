import { describe, it, expect, beforeAll } from 'vitest'
import { encodeSessionValue, decodeSessionValue } from './session-token'

beforeAll(() => {
  process.env.SESSION_SECRET = 'test-session-secret-not-for-production'
})

describe('encodeSessionValue / decodeSessionValue', () => {
  it('round-trips a valid userId', () => {
    const cookieValue = encodeSessionValue('user-123')
    expect(decodeSessionValue(cookieValue)).toBe('user-123')
  })

  it('rejects a forged cookie with an attacker-chosen userId and no valid signature', () => {
    // This is exactly the exploit the signing fix closes: previously the raw
    // userId WAS the cookie, so this forged value would have authenticated
    // as "admin-user-id" with zero knowledge of any secret.
    const forged = 'admin-user-id.deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef'
    expect(decodeSessionValue(forged)).toBeUndefined()
  })

  it('rejects a cookie signed for a different userId than it claims', () => {
    const realCookie = encodeSessionValue('victim-user-id')
    const signature = realCookie.split('.')[1]
    const swapped = `attacker-user-id.${signature}`
    expect(decodeSessionValue(swapped)).toBeUndefined()
  })

  it('rejects undefined, empty, and malformed values', () => {
    expect(decodeSessionValue(undefined)).toBeUndefined()
    expect(decodeSessionValue('')).toBeUndefined()
    expect(decodeSessionValue('no-signature-separator')).toBeUndefined()
  })
})
