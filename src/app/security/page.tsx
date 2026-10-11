import type { Metadata } from 'next'
import { InfoPage } from '@/components/layout/info-page'

export const metadata: Metadata = {
  title: 'Security at AIAppsBase',
  description: 'How AIAppsBase protects accounts, payments, and uploaded content, and how to report a security issue.',
}

const sections = [
  {
    title: 'Account security',
    content: `Passwords are hashed with bcrypt and never stored in plaintext. Sessions are signed cookies verified against a per-account version counter that's bumped on every password change, so changing your password immediately invalidates any other signed-in session. Email verification uses time-limited, attempt-limited OTP codes, and repeated failed logins are rate-limited.`,
  },
  {
    title: 'Upload safety',
    content: `Uploaded images are validated by their actual file content, not just their extension or declared type, and are re-encoded on the server rather than served as-uploaded. Deliverable files are size- and type-restricted before being accepted.`,
  },
  {
    title: 'File storage',
    content: `Deliverables and product images are stored on a dedicated SFTP server rather than on the application server's local disk, and are only ever accessed through access-controlled routes that validate ownership before serving a file.`,
  },
  {
    title: 'Payments',
    content: `All payments and seller payouts are processed by Stripe, which is PCI-DSS Level 1 certified. AIAppsBase never receives or stores your card details. Refunds and payouts are issued through signature-verified Stripe webhooks and admin actions that are both row-locked (to prevent double-processing) and recorded in an audit log.`,
  },
  {
    title: 'GitHub integration',
    content: `GitHub OAuth uses a cryptographically random, single-use state value to prevent cross-site request forgery. Access tokens are encrypted at rest and are only used server-side to fetch repository metadata or generate a download on a buyer's behalf.`,
  },
  {
    title: 'Reporting a vulnerability',
    content: `If you believe you've found a security issue, email security@aiappsbase.dev with enough detail to reproduce it. Please don't publicly disclose a vulnerability before we've had a reasonable chance to address it.`,
  },
]

export default function Page() {
  return (
    <InfoPage
      eyebrow="Trust"
      title="Security at AIAppsBase"
      description="How AIAppsBase protects accounts, payments, and uploaded content, and how to report a security issue."
      icon="Info"
      actions={[{ label: 'Report an issue', href: 'mailto:security@aiappsbase.dev', variant: 'gradient' }, { label: 'Trust center', href: '/trust', variant: 'outline' }]}
    >
      <div className="space-y-8">
        {sections.map(({ title, content }) => (
          <section key={title}>
            <h2 className="mb-3 text-base font-semibold">{title}</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">{content}</p>
          </section>
        ))}
      </div>
    </InfoPage>
  )
}
