import { createHmac, timingSafeEqual } from 'crypto'
import { requireProductionSecret } from '@/lib/env'

const DEV_FALLBACK_SECRET = 'dev-only-insecure-session-secret-do-not-use-in-production'

function getSessionSecret(): string {
  return requireProductionSecret('SESSION_SECRET', DEV_FALLBACK_SECRET)
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
