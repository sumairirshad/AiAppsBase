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

function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
}

/** Shared Resend call + error handling for every outgoing email. */
async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }): Promise<{ id: string }> {
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

  console.log(`[email] Sending "${subject}" to ${to} from "${from}" using key ${maskApiKey(apiKey)}`)

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
    throw new EmailSendError(`Could not reach Resend: ${(networkError as Error).message || 'network error'}`)
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

  console.log(`[email] Resend accepted "${subject}" to ${to} (id: ${id})`)
  return { id }
}

function layout(bodyHtml: string): string {
  return `<div style="font-family:system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">${bodyHtml}</div>`
}

export async function sendOtpEmail(to: string, otp: string) {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`\n[dev] OTP for ${to}: ${otp}\n`)
  }

  const appUrl = getAppUrl()
  const html = layout(`
    <h2 style="margin: 0 0 8px;">Verify your email</h2>
    <p style="margin: 0 0 16px;">Your verification code is:</p>
    <p style="font-size: 24px; font-weight: 700; margin: 0 0 24px;">${otp}</p>
    <p style="margin: 0 0 16px;">This code expires in 10 minutes.</p>
    <p style="margin: 0; color: #888; font-size: 12px;">If you didn't request this, you can ignore this email.</p>
    <p style="margin: 16px 0 0;"><a href="${appUrl}" style="color: #3b82f6;">${appUrl}</a></p>
  `)

  return sendEmail({ to, subject: 'Your AIApps verification code', html })
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const html = layout(`
    <h2 style="margin: 0 0 8px;">Reset your password</h2>
    <p style="margin: 0 0 16px;">We received a request to reset your password. Click the link below to choose a new one:</p>
    <p style="margin: 0 0 24px;"><a href="${resetUrl}" style="color: #3b82f6;">${resetUrl}</a></p>
    <p style="margin: 0 0 16px;">This link expires in 1 hour.</p>
    <p style="margin: 0; color: #888; font-size: 12px;">If you didn't request this, you can safely ignore this email — your password won't be changed.</p>
  `)

  return sendEmail({ to, subject: 'Reset your AIApps password', html })
}

export async function sendOrderReceiptEmail(
  to: string,
  order: { orderId: string; productTitle: string; amount: number; licenseType: string }
) {
  const appUrl = getAppUrl()
  const amountLabel = order.amount === 0 ? 'Free' : `$${order.amount.toFixed(2)}`
  const html = layout(`
    <h2 style="margin: 0 0 8px;">Thanks for your purchase!</h2>
    <p style="margin: 0 0 16px;">Your order is confirmed. Here's your receipt:</p>
    <table style="width: 100%; border-collapse: collapse; margin: 0 0 16px;">
      <tr><td style="padding: 4px 0; color: #888;">Order</td><td style="padding: 4px 0; text-align: right;">${order.orderId}</td></tr>
      <tr><td style="padding: 4px 0; color: #888;">Product</td><td style="padding: 4px 0; text-align: right;">${order.productTitle}</td></tr>
      <tr><td style="padding: 4px 0; color: #888;">License</td><td style="padding: 4px 0; text-align: right;">${order.licenseType}</td></tr>
      <tr><td style="padding: 4px 0; color: #888;">Amount</td><td style="padding: 4px 0; text-align: right; font-weight: 700;">${amountLabel}</td></tr>
    </table>
    <p style="margin: 0 0 16px;"><a href="${appUrl}/buyer/downloads" style="color: #3b82f6;">Access your download</a></p>
    <p style="margin: 0; color: #888; font-size: 12px;">You can view this order anytime from Orders &amp; invoices in your dashboard.</p>
  `)

  return sendEmail({ to, subject: `Receipt for ${order.productTitle}`, html })
}

export async function sendPayoutStatusEmail(
  to: string,
  payout: { status: 'approved' | 'rejected'; netAmount: number; reason?: string | null }
) {
  const appUrl = getAppUrl()
  const amountLabel = `$${payout.netAmount.toFixed(2)}`
  const html =
    payout.status === 'approved'
      ? layout(`
        <h2 style="margin: 0 0 8px;">Your withdrawal was approved</h2>
        <p style="margin: 0 0 16px;">${amountLabel} is on its way to your connected Stripe account.</p>
        <p style="margin: 0;"><a href="${appUrl}/panel/wallet" style="color: #3b82f6;">View your wallet</a></p>
      `)
      : layout(`
        <h2 style="margin: 0 0 8px;">Your withdrawal was rejected</h2>
        <p style="margin: 0 0 16px;">Your request for ${amountLabel} was not approved.</p>
        ${payout.reason ? `<p style="margin: 0 0 16px;">Reason: ${payout.reason}</p>` : ''}
        <p style="margin: 0;"><a href="${appUrl}/panel/wallet" style="color: #3b82f6;">View your wallet</a></p>
      `)

  return sendEmail({ to, subject: payout.status === 'approved' ? 'Your withdrawal was approved' : 'Your withdrawal was rejected', html })
}

export async function sendModerationDecisionEmail(
  to: string,
  decision: { kind: 'product' | 'seller'; status: 'approved' | 'rejected'; title?: string; reason?: string | null }
) {
  const appUrl = getAppUrl()
  const subject =
    decision.kind === 'product'
      ? `Your product was ${decision.status}`
      : `Your seller application was ${decision.status}`

  const dashboardLink =
    decision.kind === 'product'
      ? `${appUrl}/panel/seller/products`
      : `${appUrl}/panel/seller`

  const html = layout(`
    <h2 style="margin: 0 0 8px;">${subject}</h2>
    ${decision.title ? `<p style="margin: 0 0 16px;">${decision.title}</p>` : ''}
    ${
      decision.status === 'rejected' && decision.reason
        ? `<p style="margin: 0 0 16px;">Reason: ${decision.reason}</p>`
        : ''
    }
    <p style="margin: 0;"><a href="${dashboardLink}" style="color: #3b82f6;">View in your dashboard</a></p>
  `)

  return sendEmail({ to, subject, html })
}
