import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | AIAppsBase',
  description: 'Learn how AIAppsBase collects, uses, and protects your personal data.',
  robots: { index: true, follow: true },
}

const sections = [
  {
    title: '1. Information We Collect',
    content: `We collect information you provide directly: name, email address, and password when you register. If you are a Seller, we also collect payment/payout information via Stripe. We automatically collect technical data including IP address, browser type, device identifiers, and pages visited for analytics and security purposes.`,
  },
  {
    title: '2. How We Use Your Information',
    content: `We use collected information to: operate and improve the Platform; process payments and payouts; send transactional emails (OTP codes, purchase receipts, seller notifications); personalize your marketplace experience; detect and prevent fraud; comply with legal obligations; and communicate platform updates. We do not sell your personal data to third parties.`,
  },
  {
    title: '3. Cookies & Tracking',
    content: `We use essential cookies (session management, authentication), functional cookies (preferences), and analytics cookies (aggregate usage data). You can manage cookies in your browser settings. Disabling essential cookies will prevent you from logging in. For more detail, see our Cookie Policy.`,
  },
  {
    title: '4. Data Sharing',
    content: `We share your data only with: (a) Stripe — for payment processing; (b) Resend — for transactional emails; (c) Infrastructure providers — for hosting and database services, under strict data processing agreements; (d) Law enforcement — when required by applicable law. We never sell or rent your personal data for advertising.`,
  },
  {
    title: '5. Data Retention',
    content: `We retain account data for as long as your account is active. Purchase records are retained for 7 years for legal and accounting purposes. If you delete your account, your personal data is removed within 30 days, except where retention is required by law.`,
  },
  {
    title: '6. Your Rights',
    content: `Depending on your jurisdiction, you may have rights to: access, correct, or delete your personal data; restrict or object to processing; data portability; and withdraw consent. To exercise these rights, email privacy@aiappsbase.dev. We will respond within 30 days.`,
  },
  {
    title: '7. Data Security',
    content: `We implement industry-standard security measures including HTTPS encryption, hashed password storage (bcrypt), httpOnly session cookies, and access controls. However, no internet transmission is 100% secure. We encourage you to use a strong, unique password and to report any security concerns promptly.`,
  },
  {
    title: '8. Children\'s Privacy',
    content: `AIAppsBase is not directed at children under 13. We do not knowingly collect personal data from children under 13. If you believe we have inadvertently collected such data, contact us at privacy@aiappsbase.dev and we will delete it promptly.`,
  },
  {
    title: '9. International Transfers',
    content: `Your data may be processed in countries outside your country of residence. We ensure appropriate safeguards are in place for any international transfers of personal data in accordance with applicable data protection laws.`,
  },
  {
    title: '10. Changes to this Policy',
    content: `We may update this Privacy Policy periodically. For material changes, we will notify registered users via email. The "Last Updated" date at the top of this page indicates the most recent revision. Continued use of the Platform after changes constitutes acceptance.`,
  },
  {
    title: '11. Contact',
    content: `For privacy-related inquiries, contact our Data Privacy team at: privacy@aiappsbase.dev`,
  },
]

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-surface-950">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-white mb-3">Privacy Policy</h1>
          <p className="text-surface-500 text-sm">Last updated: June 1, 2025</p>
        </div>

        <div className="space-y-8">
          {sections.map(({ title, content }) => (
            <section key={title}>
              <h2 className="text-base font-semibold text-white mb-3">{title}</h2>
              <p className="text-surface-400 text-sm leading-relaxed">{content}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
