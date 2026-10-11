import { describe, it, expect, beforeAll } from 'vitest'
import { encodeSessionValue, decodeSessionValue } from './session-token'

beforeAll(() => {
  process.env.SESSION_SECRET = 'test-session-secret-not-for-production'
})

describe('encodeSessionValue / decodeSessionValue', () => {
  it('round-trips a valid userId and sessionVersion', () => {
    const cookieValue = encodeSessionValue('user-123', 0)
    expect(decodeSessionValue(cookieValue)).toEqual({ userId: 'user-123', sessionVersion: 0 })
  })

  it('rejects a forged cookie with an attacker-chosen userId and no valid signature', () => {
    // This is exactly the exploit the signing fix closes: previously the raw
    // userId WAS the cookie, so this forged value would have authenticated
    // as "admin-user-id" with zero knowledge of any secret.
    const forged = 'admin-user-id.0.deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef'
    expect(decodeSessionValue(forged)).toBeUndefined()
  })

  it('rejects a cookie signed for a different userId than it claims', () => {
    const realCookie = encodeSessionValue('victim-user-id', 0)
    const signature = realCookie.split('.')[2]
    const swapped = `attacker-user-id.0.${signature}`
    expect(decodeSessionValue(swapped)).toBeUndefined()
  })

  it('rejects a cookie whose sessionVersion was tampered with after signing', () => {
    // A stale/invalidated cookie can't be "refreshed" to a newer version by
    // just editing the version field — the signature only verifies for the
    // exact version it was issued for.
    const realCookie = encodeSessionValue('user-123', 0)
    const signature = realCookie.split('.')[2]
    const tampered = `user-123.1.${signature}`
    expect(decodeSessionValue(tampered)).toBeUndefined()
  })

  it('rejects undefined, empty, and malformed values', () => {
    expect(decodeSessionValue(undefined)).toBeUndefined()
    expect(decodeSessionValue('')).toBeUndefined()
    expect(decodeSessionValue('no-signature-separator')).toBeUndefined()
    expect(decodeSessionValue('user-123.not-a-number.deadbeef')).toBeUndefined()
  })
})
