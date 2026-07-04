/**
 * Curated demo content for the marketing landing page.
 * Self-contained (no DB) so the homepage renders anywhere. Phase 4 swaps the
 * live marketplace sections for seeded database records.
 */

export type LandingRepo = {
  id: string
  name: string
  owner: string
  description: string
  price: number
  category: string
  language: string
  languageColor: string
  stars: number
  forks: number
  rating: number
  sales: number
  aiTool: string
  tags: string[]
  gradient: string
  featured?: boolean
  trending?: boolean
}

export const featuredRepos: LandingRepo[] = [
  {
    id: 'nexus-saas',
    name: 'nexus-saas-starter',
    owner: 'aurelia',
    description:
      'Production-grade Next.js 14 SaaS boilerplate — auth, Stripe billing, teams, and a polished dashboard out of the box.',
    price: 89,
    category: 'SaaS',
    language: 'TypeScript',
    languageColor: '#3178c6',
    stars: 4820,
    forks: 612,
    rating: 4.9,
    sales: 1243,
    aiTool: 'Claude',
    tags: ['Next.js', 'Stripe', 'Prisma'],
    gradient: 'from-indigo-500 via-violet-500 to-fuchsia-500',
    featured: true,
    trending: true,
  },
  {
    id: 'orbit-ui',
    name: 'orbit-ui-kit',
    owner: 'lumen-labs',
    description:
      '160+ accessible React components with dark mode, motion, and a Figma library. The design system your team keeps reaching for.',
    price: 59,
    category: 'Components',
    language: 'TypeScript',
    languageColor: '#3178c6',
    stars: 8930,
    forks: 1120,
    rating: 4.8,
    sales: 3410,
    aiTool: 'v0',
    tags: ['React', 'Tailwind', 'Radix'],
    gradient: 'from-sky-500 via-cyan-500 to-emerald-500',
    featured: true,
    trending: true,
  },
  {
    id: 'quantum-dash',
    name: 'quantum-analytics',
    owner: 'stric',
    description:
      'Real-time analytics dashboard with 30+ chart types, funnels, cohorts, and a drag-and-drop report builder.',
    price: 74,
    category: 'Dashboard',
    language: 'TypeScript',
    languageColor: '#3178c6',
    stars: 3210,
    forks: 388,
    rating: 4.7,
    sales: 862,
    aiTool: 'Cursor',
    tags: ['React', 'Recharts', 'tRPC'],
    gradient: 'from-amber-500 via-orange-500 to-rose-500',
    featured: true,
  },
  {
    id: 'commerce-edge',
    name: 'commerce-edge',
    owner: 'pixelforge',
    description:
      'Headless commerce storefront on the edge — cart, checkout, subscriptions, and a fully typed product catalog.',
    price: 99,
    category: 'E-commerce',
    language: 'TypeScript',
    languageColor: '#3178c6',
    stars: 2740,
    forks: 301,
    rating: 4.9,
    sales: 540,
    aiTool: 'Bolt',
    tags: ['Next.js', 'Shopify', 'Edge'],
    gradient: 'from-emerald-500 via-teal-500 to-cyan-500',
    featured: true,
    trending: true,
  },
  {
    id: 'aurora-portfolio',
    name: 'aurora-portfolio',
    owner: 'monogram',
    description:
      'A cinematic portfolio template with scroll-driven animations, a CMS-ready blog, and perfect Lighthouse scores.',
    price: 29,
    category: 'Portfolio',
    language: 'Astro',
    languageColor: '#ff5d01',
    stars: 1980,
    forks: 210,
    rating: 4.8,
    sales: 1120,
    aiTool: 'Lovable',
    tags: ['Astro', 'Motion', 'MDX'],
    gradient: 'from-fuchsia-500 via-pink-500 to-rose-500',
    featured: true,
  },
  {
    id: 'pulse-mobile',
    name: 'pulse-fitness-app',
    owner: 'kinetic',
    description:
      'Cross-platform fitness app — workout plans, HealthKit sync, streaks, and a social feed. Ships iOS + Android.',
    price: 129,
    category: 'Mobile',
    language: 'Dart',
    languageColor: '#00b4ab',
    stars: 1540,
    forks: 176,
    rating: 4.6,
    sales: 388,
    aiTool: 'ChatGPT',
    tags: ['Flutter', 'Firebase', 'HealthKit'],
    gradient: 'from-violet-500 via-purple-500 to-indigo-500',
    trending: true,
  },
]

export type Category = {
  name: string
  slug: string
  count: number
  icon: string
  gradient: string
}

export const categories: Category[] = [
  { name: 'AI Projects', slug: 'ai', count: 428, icon: 'Sparkles', gradient: 'from-violet-500 to-fuchsia-500' },
  { name: 'SaaS Boilerplates', slug: 'saas', count: 312, icon: 'Layers', gradient: 'from-indigo-500 to-blue-500' },
  { name: 'Templates', slug: 'templates', count: 540, icon: 'LayoutTemplate', gradient: 'from-sky-500 to-cyan-500' },
  { name: 'Components', slug: 'components', count: 690, icon: 'Component', gradient: 'from-emerald-500 to-teal-500' },
  { name: 'Dashboards', slug: 'dashboards', count: 244, icon: 'LayoutDashboard', gradient: 'from-amber-500 to-orange-500' },
  { name: 'Mobile Apps', slug: 'mobile', count: 186, icon: 'Smartphone', gradient: 'from-rose-500 to-pink-500' },
  { name: 'Chrome Extensions', slug: 'extensions', count: 132, icon: 'Puzzle', gradient: 'from-teal-500 to-green-500' },
  { name: 'Scripts & Tools', slug: 'scripts', count: 298, icon: 'Terminal', gradient: 'from-slate-500 to-zinc-500' },
]

export type Technology = { name: string; count: number; color: string }

export const technologies: Technology[] = [
  { name: 'Next.js', count: 1240, color: '#ffffff' },
  { name: 'React', count: 2180, color: '#61dafb' },
  { name: 'TypeScript', count: 1890, color: '#3178c6' },
  { name: 'Vue', count: 640, color: '#42b883' },
  { name: 'Node.js', count: 980, color: '#83cd29' },
  { name: 'Python', count: 870, color: '#3776ab' },
  { name: 'Django', count: 320, color: '#0c4b33' },
  { name: 'Laravel', count: 410, color: '#ff2d20' },
  { name: 'Flutter', count: 380, color: '#00b4ab' },
  { name: 'React Native', count: 460, color: '#61dafb' },
  { name: 'Svelte', count: 290, color: '#ff3e00' },
  { name: 'Tailwind', count: 1560, color: '#38bdf8' },
]

export const trustedBy = [
  'Vercel', 'Linear', 'Supabase', 'Stripe', 'Raycast', 'Framer',
  'PostHog', 'Resend', 'Clerk', 'Neon', 'Cal.com', 'Turso',
]

export type Stat = { label: string; value: string; sub: string; icon: string }

export const stats: Stat[] = [
  { label: 'Projects listed', value: '12,400+', sub: 'across 40 categories', icon: 'Package' },
  { label: 'Active sellers', value: '3,200', sub: 'verified developers', icon: 'Users' },
  { label: 'Paid out to creators', value: '$4.8M', sub: 'and counting', icon: 'Wallet' },
  { label: 'Buyer satisfaction', value: '98.6%', sub: 'from 60k+ reviews', icon: 'HeartHandshake' },
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
      'Reach 2M+ monthly developers. SEO-optimized listings, curated collections, and newsletter placements included.',
    icon: 'Globe',
  },
]

export type WorkflowStep = { step: string; title: string; description: string; icon: string }

export const workflow: WorkflowStep[] = [
  {
    step: '01',
    title: 'Connect GitHub',
    description: 'Authorize AIAppsBase and pick the repositories you want to sell. No code leaves GitHub until a sale closes.',
    icon: 'Github',
  },
  {
    step: '02',
    title: 'Create your listing',
    description: 'Add screenshots, a demo link, tech stack, and pricing. Our editor auto-detects your framework and license.',
    icon: 'PencilRuler',
  },
  {
    step: '03',
    title: 'Get discovered',
    description: 'Your project goes live to millions of developers, ranked by quality, freshness, and buyer signals.',
    icon: 'Rocket',
  },
  {
    step: '04',
    title: 'Get paid',
    description: 'Buyers purchase, get instant access, and you collect revenue. Withdraw anytime with two clicks.',
    icon: 'CircleDollarSign',
  },
]

export type Seller = {
  name: string
  handle: string
  avatar: string
  tagline: string
  sales: number
  rating: number
  products: number
  badge: string
}

export const featuredSellers: Seller[] = [
  {
    name: 'Alex Rivera', handle: 'aurelia', avatar: 'https://avatars.githubusercontent.com/u/9919?v=4',
    tagline: 'SaaS boilerplates & dev tooling', sales: 4200, rating: 4.9, products: 24, badge: 'Top Seller',
  },
  {
    name: 'Mira Chen', handle: 'lumen-labs', avatar: 'https://avatars.githubusercontent.com/u/810438?v=4',
    tagline: 'Design systems & UI kits', sales: 6800, rating: 4.9, products: 18, badge: 'Power Author',
  },
  {
    name: 'Dev Patel', handle: 'stric', avatar: 'https://avatars.githubusercontent.com/u/1024025?v=4',
    tagline: 'Data dashboards & analytics', sales: 2100, rating: 4.8, products: 12, badge: 'Rising Star',
  },
  {
    name: 'Sofia Marín', handle: 'monogram', avatar: 'https://avatars.githubusercontent.com/u/499550?v=4',
    tagline: 'Award-winning web templates', sales: 3300, rating: 4.8, products: 21, badge: 'Verified',
  },
]

export type Testimonial = {
  quote: string
  name: string
  role: string
  avatar: string
}

export const testimonials: Testimonial[] = [
  {
    quote:
      'I listed my Next.js starter on a Friday and made $2,300 by Monday. The GitHub sync meant zero busywork — it just worked.',
    name: 'Jordan Blake', role: 'Indie hacker · @jblake', avatar: 'https://avatars.githubusercontent.com/u/14985020?v=4',
  },
  {
    quote:
      'We replaced three weeks of internal setup with a $79 boilerplate from AIAppsBase. Best money our startup has spent.',
    name: 'Priya Nair', role: 'CTO, Loop Labs', avatar: 'https://avatars.githubusercontent.com/u/66577?v=4',
  },
  {
    quote:
      'The buyer protection and instant delivery made me finally trust a code marketplace. Now it’s my default side income.',
    name: 'Marco Rossi', role: 'Full-stack developer', avatar: 'https://avatars.githubusercontent.com/u/172641?v=4',
  },
  {
    quote:
      'Quality bar is genuinely high. Everything I’ve bought has been clean, documented, and actually production-ready.',
    name: 'Hannah Wu', role: 'Founder, Draftly', avatar: 'https://avatars.githubusercontent.com/u/9385?v=4',
  },
  {
    quote:
      'As a designer, the UI kits here saved my team months. The Figma-to-code parity is unreal.',
    name: 'Tom Fisher', role: 'Design lead, Northwind', avatar: 'https://avatars.githubusercontent.com/u/30402911?v=4',
  },
  {
    quote:
      'Payouts are fast and transparent. I can see exactly where every sale comes from. Feels built by people who ship.',
    name: 'Aisha Khan', role: 'Creator · 40 listings', avatar: 'https://avatars.githubusercontent.com/u/1500684?v=4',
  },
]

export type Plan = {
  name: string
  price: string
  period: string
  description: string
  fee: string
  features: string[]
  highlighted?: boolean
  cta: string
}

export const plans: Plan[] = [
  {
    name: 'Starter',
    price: '$0',
    period: 'forever',
    description: 'Everything you need to make your first sale.',
    fee: '10% per sale',
    features: ['Unlimited buyers', 'GitHub sync', 'Instant delivery', 'Basic analytics', 'Community support'],
    cta: 'Start free',
  },
  {
    name: 'Pro',
    price: '$19',
    period: 'per month',
    description: 'For creators who sell seriously.',
    fee: '5% per sale',
    features: [
      'Everything in Starter',
      'Lower 5% fee',
      'Advanced analytics',
      'Featured placements',
      'Custom storefront',
      'Priority payouts',
    ],
    highlighted: true,
    cta: 'Go Pro',
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: 'billed annually',
    description: 'For teams and high-volume sellers.',
    fee: 'Volume pricing',
    features: [
      'Everything in Pro',
      'Dedicated manager',
      'Team seats & roles',
      'SSO & audit logs',
      'API access',
      'Custom contracts',
    ],
    cta: 'Contact sales',
  },
]

export type Faq = { q: string; a: string }

export const faqs: Faq[] = [
  {
    q: 'How does selling a GitHub repository work?',
    a: 'Connect your GitHub account, choose which repositories to list, and set a price. When a buyer purchases, AIAppsBase grants them access — either a private-repo collaborator invite or a signed archive download — and issues a license key. Your source stays private until a sale closes.',
  },
  {
    q: 'What fees does AIAppsBase charge?',
    a: 'The Starter plan is free with a 10% fee per sale. Pro is $19/month and drops the fee to 5%. There are no listing fees, and you keep the rest. Payments are processed securely through Stripe.',
  },
  {
    q: 'How and when do I get paid?',
    a: 'Sales are held for a 14-day buyer-protection window, then become available in your wallet. You can withdraw to a bank account, PayPal, or supported payout method at any time. Pro sellers get priority payouts.',
  },
  {
    q: 'Is buyer protection included?',
    a: 'Yes. Every purchase is covered by our protection policy. If a project is materially misrepresented or broken, buyers can request a refund within the protection window, and our team mediates disputes fairly.',
  },
  {
    q: 'How do you keep the marketplace high quality?',
    a: 'Every listing passes automated malware and secret scanning plus a human review before going live. Listings are ranked by code quality, documentation, freshness, and verified buyer reviews.',
  },
  {
    q: 'Can I sell open-source projects?',
    a: 'You can sell commercial licenses, premium tiers, or support around projects you own the rights to. We provide license templates for personal, commercial, and extended-commercial use.',
  },
]
