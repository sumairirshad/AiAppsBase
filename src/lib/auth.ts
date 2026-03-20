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
