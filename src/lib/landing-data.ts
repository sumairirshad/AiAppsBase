/**
 * Static marketing copy for the landing page (feature descriptions, the
 * how-it-works steps, pricing tiers, FAQ, and trusted-by logos). This is site
 * content, not application data — all dynamic figures, listings, and sellers
 * on the landing page are loaded live from the database.
 */

export const trustedBy = [
  'Vercel', 'Linear', 'Supabase', 'Stripe', 'Raycast', 'Framer',
  'PostHog', 'Resend', 'Clerk', 'Neon', 'Cal.com', 'Turso',
]

export type Feature = { title: string; description: string; icon: string }

export const features: Feature[] = [
  {
    title: 'One-click GitHub sync',
    description:
      'Connect your account and import repositories in seconds. Stars, forks, languages, releases, and README stay in sync automatically.',
    icon: 'Github',
  },
  {
    title: 'Instant, secure delivery',
    description:
      'Buyers get access the moment they pay — private repo invites or signed archive downloads, with license keys generated on the fly.',
    icon: 'ShieldCheck',
  },
  {
    title: 'Escrow-backed payouts',
    description:
      'Stripe-powered payments with a 14-day protection window. Withdraw to your bank, PayPal, or wallet whenever you like.',
    icon: 'Wallet',
  },
  {
    title: 'Built-in analytics',
    description:
      'Track views, conversion, revenue, and traffic sources with a dashboard that would make a growth team jealous.',
    icon: 'LineChart',
  },
  {
    title: 'Verified & scanned',
    description:
      'Every listing passes automated malware and secret scanning plus human review before it ever reaches a buyer.',
    icon: 'BadgeCheck',
  },
  {
    title: 'Global audience',
    description:
      'Reach developers worldwide. SEO-optimized listings, curated collections, and newsletter placements included.',
    icon: 'Globe',
  },
]

export type WorkflowStep = { step: string; title: string; description: string; icon: string }

export const workflow: WorkflowStep[] = [
  { step: '01', title: 'Connect GitHub', description: 'Authorize AIAppsBase and pick the repositories you want to sell. No code leaves GitHub until a sale closes.', icon: 'Github' },
  { step: '02', title: 'Create your listing', description: 'Add screenshots, a demo link, tech stack, and pricing. Our editor auto-detects your framework and license.', icon: 'PencilRuler' },
  { step: '03', title: 'Get discovered', description: 'Your project goes live to developers worldwide, ranked by quality, freshness, and buyer signals.', icon: 'Rocket' },
  { step: '04', title: 'Get paid', description: 'Buyers purchase, get instant access, and you collect revenue. Withdraw anytime with two clicks.', icon: 'CircleDollarSign' },
]

export type Plan = {
  name: string; price: string; period: string; description: string; fee: string
  features: string[]; highlighted?: boolean; cta: string
}

export const plans: Plan[] = [
  {
    name: 'Starter', price: '$0', period: 'forever',
    description: 'Everything you need to make your first sale.', fee: '10% per sale',
    features: ['Unlimited buyers', 'GitHub sync', 'Instant delivery', 'Basic analytics', 'Community support'],
    cta: 'Start free',
  },
  {
    name: 'Pro', price: '$19', period: 'per month',
    description: 'For creators who sell seriously.', fee: '5% per sale',
    features: ['Everything in Starter', 'Lower 5% fee', 'Advanced analytics', 'Featured placements', 'Custom storefront', 'Priority payouts'],
    highlighted: true, cta: 'Go Pro',
  },
  {
    name: 'Enterprise', price: 'Custom', period: 'billed annually',
    description: 'For teams and high-volume sellers.', fee: 'Volume pricing',
    features: ['Everything in Pro', 'Dedicated manager', 'Team seats & roles', 'SSO & audit logs', 'API access', 'Custom contracts'],
    cta: 'Contact sales',
  },
]

export type Faq = { q: string; a: string }

export const faqs: Faq[] = [
  { q: 'How does selling a GitHub repository work?', a: 'Connect your GitHub account, choose which repositories to list, and set a price. When a buyer purchases, AIAppsBase grants them access — either a private-repo collaborator invite or a signed archive download — and issues a license key. Your source stays private until a sale closes.' },
  { q: 'What fees does AIAppsBase charge?', a: 'The Starter plan is free with a 10% fee per sale. Pro is $19/month and drops the fee to 5%. There are no listing fees, and you keep the rest. Payments are processed securely through Stripe.' },
  { q: 'How and when do I get paid?', a: 'Sales are held for a 14-day buyer-protection window, then become available in your wallet. You can withdraw to a bank account, PayPal, or supported payout method at any time. Pro sellers get priority payouts.' },
  { q: 'Is buyer protection included?', a: 'Yes. Every purchase is covered by our protection policy. If a project is materially misrepresented or broken, buyers can request a refund within the protection window, and our team mediates disputes fairly.' },
  { q: 'How do you keep the marketplace high quality?', a: 'Every listing passes automated malware and secret scanning plus a human review before going live. Listings are ranked by code quality, documentation, freshness, and verified buyer reviews.' },
  { q: 'Can I sell open-source projects?', a: 'You can sell commercial licenses, premium tiers, or support around projects you own the rights to. We provide license templates for personal, commercial, and extended-commercial use.' },
]
