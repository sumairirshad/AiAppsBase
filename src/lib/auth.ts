import bcrypt from 'bcryptjs'

export function hashPassword(password: string) {
  return bcrypt.hash(password, 10)
}

export function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash)
}

/**
 * Shared password-strength policy for registration, password change, and
 * password reset. Returns an error message if the password fails, or null
 * if it's acceptable.
 */
export function validatePasswordStrength(password: string): string | null {
  if (password.length < 8) return 'Password must be at least 8 characters.'
  if (password.length > 128) return 'Password must be 128 characters or fewer.'
  if (!/[a-zA-Z]/.test(password)) return 'Password must contain at least one letter.'
  if (!/[0-9]/.test(password)) return 'Password must contain at least one number.'
  return null
}

export function generateOtpCode() {
  // 6-digit numeric code
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export function getOtpExpiry(minutes = 10) {
  return new Date(Date.now() + minutes * 60 * 1000)
}

export const OTP_MAX_ATTEMPTS = 5
export const OTP_LOCKOUT_MINUTES = 15
export const OTP_RESEND_COOLDOWN_SECONDS = 30

export const LOGIN_MAX_ATTEMPTS = 8
export const LOGIN_LOCKOUT_MINUTES = 15
