export async function sendOtpEmail(to: string, otp: string) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is required to send emails')
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

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: 'no-reply@aiapps.com',
      to,
      subject,
      html,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Failed to send email: ${res.status} ${text}`)
  }
}
