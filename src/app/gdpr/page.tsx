import type { Metadata } from 'next'
import { InfoPage } from '@/components/layout/info-page'

export const metadata: Metadata = {
  title: 'GDPR & data protection',
  description: 'How AIAppsBase collects, processes, and protects personal data under the GDPR, and how you can exercise your rights as a data subject.',
}

const sections = [
  {
    title: '1. Scope',
    content: `This page explains how AIAppsBase handles personal data for users in the European Economic Area and UK under the General Data Protection Regulation ("GDPR"). It supplements, and doesn't replace, our Privacy Policy.`,
  },
  {
    title: '2. What we collect',
    content: `Account details (name, email, hashed password), seller profile information you choose to add (bio, location, website), GitHub account data you authorize us to access when you connect a repository, order and payout records, and support correspondence. We never store raw payment card details — those are handled entirely by Stripe.`,
  },
  {
    title: '3. Legal basis for processing',
    content: `We process account and transaction data to perform our contract with you (operating your account, processing purchases and payouts), comply with legal obligations (tax and fraud-prevention records), and our legitimate interests (platform security, abuse prevention, product analytics). Marketing emails, including newsletter signups, are sent only with your consent and can be withdrawn at any time.`,
  },
  {
    title: '4. Your rights',
    content: `Subject to applicable law, you can request: access to the personal data we hold about you; correction of inaccurate data; erasure of your data (subject to records we're legally required to keep, such as completed transactions); restriction or objection to certain processing; and a portable export of your data. To exercise any of these, email privacy@aiappsbase.dev — we aim to respond within 30 days.`,
  },
  {
    title: '5. Data retention',
    content: `Account data is kept while your account is active. Order, payout, and audit records are kept for as long as required for tax, accounting, and dispute-resolution purposes after account closure.`,
  },
  {
    title: '6. International transfers',
    content: `We use infrastructure and processors (hosting, email delivery via Resend, payments via Stripe) that may process data outside your country. Where required, we rely on appropriate safeguards such as standard contractual clauses.`,
  },
  {
    title: '7. Complaints',
    content: `If you believe we have not handled your data properly, you can lodge a complaint with your local data protection supervisory authority, in addition to contacting us directly.`,
  },
]

export default function Page() {
  return (
    <InfoPage
      eyebrow="Legal"
      title="GDPR & data protection"
      description="How AIAppsBase collects, processes, and protects personal data under the GDPR, and how you can exercise your rights as a data subject."
      icon="Info"
      actions={[{ label: 'Privacy policy', href: '/privacy', variant: 'gradient' }, { label: 'Contact DPO', href: 'mailto:privacy@aiappsbase.dev', variant: 'outline' }]}
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
