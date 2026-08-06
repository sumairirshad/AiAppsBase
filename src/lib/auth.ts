import bcrypt from 'bcryptjs'

export function hashPassword(password: string) {
  return bcrypt.hash(password, 10)
}

export function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash)
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
