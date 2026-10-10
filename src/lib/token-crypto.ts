import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto'
import { requireProductionSecret } from '@/lib/env'

const DEV_FALLBACK_KEY = 'dev-only-insecure-token-encryption-key-do-not-use-in-production'

function getKey(): Buffer {
  const secret = requireProductionSecret('TOKEN_ENCRYPTION_KEY', DEV_FALLBACK_KEY)
  // SHA-256 the provided secret so any length input yields a valid 32-byte AES-256 key.
  return createHash('sha256').update(secret).digest()
}

/** Encrypts a third-party secret (e.g. a GitHub access token) for storage at rest. */
export function encryptToken(plaintext: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', getKey(), iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  return [iv.toString('base64'), authTag.toString('base64'), encrypted.toString('base64')].join('.')
}

/** Decrypts a value produced by encryptToken. Returns null (never throws) if the value is missing, malformed, or was encrypted with a different key. */
export function decryptToken(ciphertext: string | null | undefined): string | null {
  if (!ciphertext) return null
  try {
    const [ivB64, tagB64, dataB64] = ciphertext.split('.')
    if (!ivB64 || !tagB64 || !dataB64) return null
    const decipher = createDecipheriv('aes-256-gcm', getKey(), Buffer.from(ivB64, 'base64'))
    decipher.setAuthTag(Buffer.from(tagB64, 'base64'))
    const decrypted = Buffer.concat([decipher.update(Buffer.from(dataB64, 'base64')), decipher.final()])
    return decrypted.toString('utf8')
  } catch {
    return null
  }
}
