import type { Metadata } from 'next'

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
    <div className="min-h-screen bg-surface-950">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-white mb-3">Cookie Policy</h1>
          <p className="text-surface-500 text-sm">Last updated: June 1, 2025</p>
        </div>

        <p className="text-surface-400 text-sm leading-relaxed mb-10">
          This Cookie Policy explains what cookies are, what cookies AIAppsBase uses, and how you can
          control them. By using our Platform, you agree to our use of cookies as described in this
          policy.
        </p>

        <h2 className="text-base font-semibold text-white mb-4">What are cookies?</h2>
        <p className="text-surface-400 text-sm leading-relaxed mb-10">
          Cookies are small text files stored on your device by a website. They are widely used to
          make websites work efficiently and to provide information to website owners. Cookies are
          not harmful — they cannot run programs or deliver viruses.
        </p>

        <div className="space-y-8">
          {cookieTypes.map(({ name, required, description, examples }) => (
            <section key={name} className="glass rounded-2xl p-6 border border-white/5">
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-base font-semibold text-white">{name}</h2>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                    required
                      ? 'bg-brand-500/15 text-brand-400 border border-brand-500/20'
                      : 'bg-surface-700/50 text-surface-400 border border-surface-600/20'
                  }`}
                >
                  {required ? 'Required' : 'Optional'}
                </span>
              </div>
              <p className="text-surface-400 text-sm leading-relaxed mb-4">{description}</p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-surface-500 border-b border-white/5">
                      <th className="text-left py-2 pr-4 font-medium">Cookie name</th>
                      <th className="text-left py-2 pr-4 font-medium">Purpose</th>
                      <th className="text-left py-2 font-medium">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {examples.map(({ name: cookieName, purpose, duration }) => (
                      <tr key={cookieName} className="border-b border-white/5 last:border-0">
                        <td className="py-2 pr-4 text-brand-400 font-mono">{cookieName}</td>
                        <td className="py-2 pr-4 text-surface-400">{purpose}</td>
                        <td className="py-2 text-surface-500">{duration}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>

        <section className="mt-10">
          <h2 className="text-base font-semibold text-white mb-3">Managing cookies</h2>
          <p className="text-surface-400 text-sm leading-relaxed">
            You can control cookies through your browser settings. Most browsers allow you to refuse
            or delete cookies. Note that disabling strictly necessary cookies will prevent you from
            logging in. For detailed instructions, visit your browser&apos;s help documentation or{' '}
            <a
              href="https://www.allaboutcookies.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-400 hover:text-brand-300 underline"
            >
              allaboutcookies.org
            </a>
            .
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-base font-semibold text-white mb-3">Contact</h2>
          <p className="text-surface-400 text-sm leading-relaxed">
            For questions about this Cookie Policy, contact us at{' '}
            <a href="mailto:privacy@aiappsbase.dev" className="text-brand-400 hover:text-brand-300">
              privacy@aiappsbase.dev
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  )
}
