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

function sign(userId: string): string {
  return createHmac('sha256', getSessionSecret()).update(userId).digest('hex')
}

/** Builds the signed cookie value `${userId}.${signature}` so a client can never forge a session for another user. */
export function encodeSessionValue(userId: string): string {
  return `${userId}.${sign(userId)}`
}

/** Verifies the signature and returns the userId, or undefined if the cookie is missing, malformed, or tampered with. */
export function decodeSessionValue(value: string | undefined): string | undefined {
  if (!value) return undefined
  const separatorIndex = value.lastIndexOf('.')
  if (separatorIndex <= 0) return undefined

  const userId = value.slice(0, separatorIndex)
  const signature = value.slice(separatorIndex + 1)
  const expected = sign(userId)

  const signatureBuf = Buffer.from(signature)
  const expectedBuf = Buffer.from(expected)
  if (signatureBuf.length !== expectedBuf.length) return undefined
  if (!timingSafeEqual(signatureBuf, expectedBuf)) return undefined

  return userId
}
