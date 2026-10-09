import type { Metadata } from 'next'
import { InfoPage } from '@/components/layout/info-page'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Cookie Policy | AIAppsBase',
  description: 'Learn about the cookies AIAppsBase uses, what they do, and how to manage them.',
  robots: { index: true, follow: true },
}

const cookieTypes = [
  {
    name: 'Strictly Necessary Cookies',
    required: true,
    description:
      'These cookies are required for the Platform to function. They enable core features like user authentication (session cookies), security (CSRF tokens), and load balancing. The Platform cannot function properly without them.',
    examples: [
      { name: 'session_user_id', purpose: 'Keeps you logged in across page loads', duration: 'Session' },
      { name: '__Host-next-auth.csrf-token', purpose: 'Cross-site request forgery protection', duration: 'Session' },
    ],
  },
  {
    name: 'Functional Cookies',
    required: false,
    description:
      'These cookies remember your preferences to give you a better experience — for example, your preferred view mode in the marketplace (grid vs list) or your selected filters.',
    examples: [
      { name: 'view_mode', purpose: 'Remembers grid/list preference in marketplace', duration: '1 year' },
    ],
  },
  {
    name: 'Analytics Cookies',
    required: false,
    description:
      'We use anonymized analytics cookies to understand how visitors interact with the Platform. This data helps us improve the user experience. We do not track you across other websites.',
    examples: [
      { name: '_ga', purpose: 'Distinguishes unique users (anonymized)', duration: '2 years' },
      { name: '_ga_*', purpose: 'Stores session state for analytics', duration: '2 years' },
    ],
  },
  {
    name: 'Payment Cookies',
    required: false,
    description:
      'When you initiate checkout, Stripe sets cookies to handle the payment session securely. These are set by Stripe\'s domain and governed by Stripe\'s privacy policy.',
    examples: [
      { name: '__stripe_mid', purpose: 'Fraud detection for payment security', duration: '1 year' },
      { name: '__stripe_sid', purpose: 'Stripe session management', duration: '30 minutes' },
    ],
  },
]

export default function CookiesPage() {
  return (
    <InfoPage
      eyebrow="Legal"
      title="Cookie Policy"
      description="Last updated: June 1, 2025"
      icon="Info"
    >
      <p className="mb-10 text-sm leading-relaxed text-muted-foreground">
        This Cookie Policy explains what cookies are, what cookies AIAppsBase uses, and how you can
        control them. By using our Platform, you agree to our use of cookies as described in this
        policy.
      </p>

      <h2 className="mb-4 text-base font-semibold">What are cookies?</h2>
      <p className="mb-10 text-sm leading-relaxed text-muted-foreground">
        Cookies are small text files stored on your device by a website. They are widely used to
        make websites work efficiently and to provide information to website owners. Cookies are
        not harmful — they cannot run programs or deliver viruses.
      </p>

      <div className="space-y-6">
        {cookieTypes.map(({ name, required, description, examples }) => (
          <Card key={name} className="p-6">
            <div className="mb-3 flex items-center gap-3">
              <h2 className="text-base font-semibold">{name}</h2>
              <Badge variant={required ? 'brand' : 'muted'}>{required ? 'Required' : 'Optional'}</Badge>
            </div>
            <p className="mb-4 text-sm leading-relaxed text-muted-foreground">{description}</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="py-2 pr-4 text-left font-medium">Cookie name</th>
                    <th className="py-2 pr-4 text-left font-medium">Purpose</th>
                    <th className="py-2 text-left font-medium">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {examples.map(({ name: cookieName, purpose, duration }) => (
                    <tr key={cookieName} className="border-b border-border last:border-0">
                      <td className="py-2 pr-4 font-mono text-primary">{cookieName}</td>
                      <td className="py-2 pr-4 text-muted-foreground">{purpose}</td>
                      <td className="py-2 text-muted-foreground">{duration}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ))}
      </div>

      <section className="mt-10">
        <h2 className="mb-3 text-base font-semibold">Managing cookies</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          You can control cookies through your browser settings. Most browsers allow you to refuse
          or delete cookies. Note that disabling strictly necessary cookies will prevent you from
          logging in. For detailed instructions, visit your browser&apos;s help documentation or{' '}
          <a
            href="https://www.allaboutcookies.org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline hover:no-underline"
          >
            allaboutcookies.org
          </a>
          .
        </p>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-base font-semibold">Contact</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          For questions about this Cookie Policy, contact us at{' '}
          <a href="mailto:privacy@aiappsbase.dev" className="text-primary hover:underline">
            privacy@aiappsbase.dev
          </a>
          .
        </p>
      </section>
    </InfoPage>
  )
}
