import { query } from '@/lib/db'
import { generateOtpCode, getOtpExpiry, OTP_RESEND_COOLDOWN_SECONDS } from '@/lib/auth'
import { sendOtpEmail, EmailSendError } from '@/lib/email'

export type IssueOtpResult =
  | { ok: true; sent: boolean }
  | { ok: false; reason: 'locked' | 'cooldown' | 'email_failed'; message: string; retryAfter?: number }

/**
 * Creates and emails a new verification code for an unverified user.
 * Respects the OTP lockout and the resend cooldown. With `reuseRecent`, a
 * code sent within the cooldown counts as success (it's still valid), so
 * repeated sign-in attempts don't spam the inbox.
 */
export async function issueVerificationOtp(
  user: { id: string; otp_locked_until?: string | Date | null },
  email: string,
  { reuseRecent = false }: { reuseRecent?: boolean } = {}
): Promise<IssueOtpResult> {
  if (user.otp_locked_until && new Date(user.otp_locked_until).getTime() > Date.now()) {
    return { ok: false, reason: 'locked', message: 'Too many incorrect attempts. Please try again in a few minutes.' }
  }

  const lastOtpRes = await query(
    'SELECT created_at FROM otps WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
    [user.id]
  )
  if ((lastOtpRes?.rowCount ?? 0) > 0) {
    const secondsSinceLast = (Date.now() - new Date(lastOtpRes.rows[0].created_at).getTime()) / 1000
    if (secondsSinceLast < OTP_RESEND_COOLDOWN_SECONDS) {
      if (reuseRecent) return { ok: true, sent: false }
      const retryAfter = Math.ceil(OTP_RESEND_COOLDOWN_SECONDS - secondsSinceLast)
      return { ok: false, reason: 'cooldown', retryAfter, message: `Please wait ${retryAfter}s before requesting another code.` }
    }
  }

  const otp = generateOtpCode()
  await query('INSERT INTO otps (user_id, code, expires_at) VALUES ($1, $2, $3)', [
    user.id,
    otp,
    getOtpExpiry(10).toISOString(),
  ])

  try {
    await sendOtpEmail(email, otp)
  } catch (error) {
    console.error(`[otp] Failed to send OTP email to ${email}`, error)
    const message =
      error instanceof EmailSendError
        ? error.message
        : 'The verification email could not be sent. Please try again shortly.'
    return { ok: false, reason: 'email_failed', message }
  }

  return { ok: true, sent: true }
}
