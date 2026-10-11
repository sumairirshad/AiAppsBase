import { createHmac, timingSafeEqual } from 'crypto'

const DEV_FALLBACK_SECRET = 'dev-only-insecure-session-secret-do-not-use-in-production'

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET
  if (secret) return secret
  if (process.env.NODE_ENV === 'production') {
    throw new Error('SESSION_SECRET environment variable is required for session signing.')
  }
  console.warn('SESSION_SECRET is not set — using an insecure development fallback. Set SESSION_SECRET before deploying.')
  return DEV_FALLBACK_SECRET
}

function sign(userId: string, sessionVersion: number): string {
  return createHmac('sha256', getSessionSecret()).update(`${userId}.${sessionVersion}`).digest('hex')
}

export type DecodedSession = { userId: string; sessionVersion: number }

/**
 * Builds the signed cookie value `${userId}.${sessionVersion}.${signature}`.
 * sessionVersion is bumped on the user's row whenever their password
 * changes, so a cookie signed for an older version — e.g. one stolen or
 * left logged in on another device — decodes fine but no longer matches
 * the user's current version and must be treated as invalid.
 */
export function encodeSessionValue(userId: string, sessionVersion: number): string {
  return `${userId}.${sessionVersion}.${sign(userId, sessionVersion)}`
}

/** Verifies the signature and returns the decoded userId/sessionVersion, or undefined if the cookie is missing, malformed, or tampered with. */
export function decodeSessionValue(value: string | undefined): DecodedSession | undefined {
  if (!value) return undefined
  const parts = value.split('.')
  if (parts.length !== 3) return undefined

  const [userId, sessionVersionRaw, signature] = parts
  if (!userId || !signature) return undefined

  const sessionVersion = Number(sessionVersionRaw)
  if (!Number.isInteger(sessionVersion) || sessionVersion < 0) return undefined

  const expected = sign(userId, sessionVersion)
  const signatureBuf = Buffer.from(signature)
  const expectedBuf = Buffer.from(expected)
  if (signatureBuf.length !== expectedBuf.length) return undefined
  if (!timingSafeEqual(signatureBuf, expectedBuf)) return undefined

  return { userId, sessionVersion }
}
