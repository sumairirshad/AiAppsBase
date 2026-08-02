const RESEND_ENDPOINT = 'https://api.resend.com/emails'
const DEFAULT_FROM = 'AIApps <onboarding@resend.dev>'

/**
 * Thrown when the Resend API rejects or fails to accept an email.
 * Carries the exact reason (invalid key, unverified domain, rate limit, etc.)
 * so callers can surface it to the user instead of assuming success.
 */
export class EmailSendError extends Error {
  status?: number
  code?: string

  constructor(message: string, status?: number, code?: string) {
    super(message)
    this.name = 'EmailSendError'
    this.status = status
    this.code = code
  }
}

function maskApiKey(key: string) {
  if (key.length <= 8) return '****'
  return `${key.slice(0, 6)}...${key.slice(-4)}`
}

export async function sendOtpEmail(to: string, otp: string) {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`\n[dev] OTP for ${to}: ${otp}\n`)
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.error('[email] RESEND_API_KEY is not set in the environment')
    throw new EmailSendError('RESEND_API_KEY is required to send emails')
  }
  if (!apiKey.startsWith('re_')) {
    console.warn(
      `[email] RESEND_API_KEY does not look like a valid Resend key (expected it to start with "re_"). Got: ${maskApiKey(apiKey)}`
    )
  }

  const from = process.env.RESEND_FROM_EMAIL?.trim() || DEFAULT_FROM
  if (!process.env.RESEND_FROM_EMAIL) {
    console.warn(
      '[email] RESEND_FROM_EMAIL is not set, falling back to the Resend sandbox sender ' +
        `"${DEFAULT_FROM}". This sender can only deliver to the Resend account owner's own email. ` +
        'Set RESEND_FROM_EMAIL to an address on a domain verified in your Resend dashboard ' +
        '(https://resend.com/domains) to send to real users.'
    )
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const subject = 'Your AIApps verification code'

  const html = `<div style="font-family:system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
    <h2 style="margin: 0 0 8px;">Verify your email</h2>
    <p style="margin: 0 0 16px;">Your verification code is:</p>
    <p style="font-size: 24px; font-weight: 700; margin: 0 0 24px;">${otp}</p>
    <p style="margin: 0 0 16px;">This code expires in 10 minutes.</p>
    <p style="margin: 0; color: #888; font-size: 12px;">If you didn't request this, you can ignore this email.</p>
    <p style="margin: 16px 0 0;"><a href="${appUrl}" style="color: #3b82f6;">${appUrl}</a></p>
  </div>`

  console.log(`[email] Sending OTP email to ${to} from "${from}" using key ${maskApiKey(apiKey)}`)

  let res: Response
  try {
    res = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ from, to, subject, html }),
    })
  } catch (networkError) {
    console.error('[email] Network error while calling Resend API', networkError)
    throw new EmailSendError(
      `Could not reach Resend: ${(networkError as Error).message || 'network error'}`
    )
  }

  const rawBody = await res.text()
  let parsedBody: unknown = null
  try {
    parsedBody = rawBody ? JSON.parse(rawBody) : null
  } catch {
    // Resend normally returns JSON; fall back to the raw text if it doesn't.
  }

  if (!res.ok) {
    const body = (parsedBody ?? {}) as { message?: string; name?: string }
    const reason = body.message || rawBody || res.statusText || 'Unknown error'
    console.error(
      `[email] Resend API rejected the request (status ${res.status}, code "${body.name ?? 'unknown'}"): ${reason}`
    )
    throw new EmailSendError(reason, res.status, body.name)
  }

  const id = (parsedBody as { id?: string } | null)?.id
  if (!id) {
    console.error('[email] Resend returned 2xx but no email id was present in the response', rawBody)
    throw new EmailSendError('Resend did not confirm the email was accepted')
  }

  console.log(`[email] Resend accepted OTP email to ${to} (id: ${id})`)
  return { id }
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.error('[email] RESEND_API_KEY is not set in the environment')
    throw new EmailSendError('RESEND_API_KEY is required to send emails')
  }

  const from = process.env.RESEND_FROM_EMAIL?.trim() || DEFAULT_FROM
  const subject = 'Reset your AIApps password'

  const html = `<div style="font-family:system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
    <h2 style="margin: 0 0 8px;">Reset your password</h2>
    <p style="margin: 0 0 16px;">We received a request to reset your password. Click the link below to choose a new one:</p>
    <p style="margin: 0 0 24px;"><a href="${resetUrl}" style="color: #3b82f6;">${resetUrl}</a></p>
    <p style="margin: 0 0 16px;">This link expires in 1 hour.</p>
    <p style="margin: 0; color: #888; font-size: 12px;">If you didn't request this, you can safely ignore this email — your password won't be changed.</p>
  </div>`

  console.log(`[email] Sending password reset email to ${to} from "${from}" using key ${maskApiKey(apiKey)}`)

  let res: Response
  try {
    res = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ from, to, subject, html }),
    })
  } catch (networkError) {
    console.error('[email] Network error while calling Resend API', networkError)
    throw new EmailSendError(
      `Could not reach Resend: ${(networkError as Error).message || 'network error'}`
    )
  }

  const rawBody = await res.text()
  let parsedBody: unknown = null
  try {
    parsedBody = rawBody ? JSON.parse(rawBody) : null
  } catch {
    // Resend normally returns JSON; fall back to the raw text if it doesn't.
  }

  if (!res.ok) {
    const body = (parsedBody ?? {}) as { message?: string; name?: string }
    const reason = body.message || rawBody || res.statusText || 'Unknown error'
    console.error(
      `[email] Resend API rejected the password reset request (status ${res.status}, code "${body.name ?? 'unknown'}"): ${reason}`
    )
    throw new EmailSendError(reason, res.status, body.name)
  }

  const id = (parsedBody as { id?: string } | null)?.id
  if (!id) {
    throw new EmailSendError('Resend did not confirm the email was accepted')
  }

  console.log(`[email] Resend accepted password reset email to ${to} (id: ${id})`)
  return { id }
}
