import { query } from '@/lib/db'
import { OTP_MAX_ATTEMPTS, OTP_LOCKOUT_MINUTES, generateOtpCode, getOtpExpiry } from '@/lib/auth'
import { sendOtpEmail, EmailSendError } from '@/lib/email'

/**
 * The malware-override flow (Phase 3 of the file-security audit): a buyer
 * who has been shown the "this file was flagged as malicious" warning and
 * still wants to proceed must re-prove who they are with both their
 * password AND a fresh emailed one-time code before an exceptional
 * download is issued. This reuses the exact same `otps` table and
 * lockout fields (otp_failed_attempts/otp_locked_until on users) that
 * registration/sign-in verification already uses — it's the same
 * "prove you own this authenticated account's email" primitive, just
 * invoked from a different place, not a parallel OTP system.
 */

export type RequestOverrideOtpResult =
  | { ok: true }
  | { ok: false; reason: 'locked' | 'cooldown' | 'email_failed'; message: string }

export async function requestDownloadOverrideOtp(userId: string, email: string): Promise<RequestOverrideOtpResult> {
  const userRes = await query<{ otp_locked_until: string | null }>(
    'SELECT otp_locked_until FROM users WHERE id = $1',
    [userId]
  )
  const lockedUntil = userRes.rows[0]?.otp_locked_until
  if (lockedUntil && new Date(lockedUntil).getTime() > Date.now()) {
    return { ok: false, reason: 'locked', message: 'Too many incorrect attempts. Please try again in a few minutes.' }
  }

  const code = generateOtpCode()
  await query('INSERT INTO otps (user_id, code, expires_at) VALUES ($1, $2, $3)', [
    userId, code, getOtpExpiry(10).toISOString(),
  ])

  try {
    await sendOtpEmail(email, code)
  } catch (error) {
    console.error(`[download-override] Failed to send override OTP email to ${email}`, error)
    const message = error instanceof EmailSendError ? error.message : 'The verification email could not be sent. Please try again shortly.'
    return { ok: false, reason: 'email_failed', message }
  }

  return { ok: true }
}

export type VerifyOverrideOtpResult =
  | { ok: true }
  | { ok: false; reason: 'locked' | 'invalid' | 'used' | 'expired'; message: string }

export async function verifyDownloadOverrideOtp(userId: string, code: string): Promise<VerifyOverrideOtpResult> {
  const userRes = await query<{ otp_failed_attempts: number; otp_locked_until: string | null }>(
    'SELECT otp_failed_attempts, otp_locked_until FROM users WHERE id = $1',
    [userId]
  )
  const user = userRes.rows[0]
  if (!user) return { ok: false, reason: 'invalid', message: 'Invalid code' }

  if (user.otp_locked_until && new Date(user.otp_locked_until).getTime() > Date.now()) {
    return { ok: false, reason: 'locked', message: 'Too many incorrect attempts. Please request a new code in a few minutes.' }
  }

  const recordFailure = async () => {
    const attempts = (user.otp_failed_attempts ?? 0) + 1
    if (attempts >= OTP_MAX_ATTEMPTS) {
      await query(
        `UPDATE users SET otp_failed_attempts = 0, otp_locked_until = NOW() + $2 * INTERVAL '1 minute' WHERE id = $1`,
        [userId, OTP_LOCKOUT_MINUTES]
      )
    } else {
      await query('UPDATE users SET otp_failed_attempts = $2 WHERE id = $1', [userId, attempts])
    }
  }

  const otpRes = await query<{ id: string; expires_at: string; used: boolean }>(
    `SELECT id, expires_at, used FROM otps WHERE user_id = $1 AND code = $2 ORDER BY created_at DESC LIMIT 1`,
    [userId, code.trim()]
  )
  if ((otpRes.rowCount ?? 0) === 0) {
    await recordFailure()
    return { ok: false, reason: 'invalid', message: 'Invalid code' }
  }

  const otp = otpRes.rows[0]
  if (otp.used) {
    await recordFailure()
    return { ok: false, reason: 'used', message: 'This code has already been used' }
  }
  if (new Date(otp.expires_at).getTime() < Date.now()) {
    return { ok: false, reason: 'expired', message: 'This code has expired. Please request a new one.' }
  }

  await query('UPDATE otps SET used = TRUE WHERE id = $1', [otp.id])
  await query('UPDATE users SET otp_failed_attempts = 0, otp_locked_until = NULL WHERE id = $1', [userId])
  return { ok: true }
}
