export type BlogBlock =
  | { type: 'p'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'quote'; text: string }
  | { type: 'ul'; items: string[] }

export type Post = {
  slug: string
  title: string
  excerpt: string
  category: string
  author: string
  authorRole: string
  date: string
  readTime: string
  gradient: string
  featured?: boolean
  content: BlogBlock[]
}

const body = (topic: string): BlogBlock[] => [
  { type: 'p', text: `${topic} is changing how developers build and ship software. In this guide we break down what actually matters, drawing on real data from thousands of sales and creators on AIAppsBase.` },
  { type: 'h2', text: 'Why it matters now' },
  { type: 'p', text: 'The gap between an idea and a shippable product has never been smaller. AI tools handle the boilerplate, and marketplaces like AIAppsBase let creators turn that output into real, recurring income — while buyers skip weeks of setup.' },
  { type: 'ul', items: [
    'Start from production-ready foundations instead of a blank repo',
    'Lean on verified, reviewed code with buyer protection',
    'Ship faster without sacrificing quality or security',
  ] },
  { type: 'h2', text: 'What we learned' },
  { type: 'p', text: 'After analyzing the top-performing listings, a clear pattern emerged: quality documentation, thoughtful defaults, and honest previews drive the vast majority of conversions. Polish is not optional — it is the product.' },
  { type: 'quote', text: 'The best listings feel like products a real team would charge for — because they are.' },
  { type: 'p', text: 'Whether you are buying your next starting point or selling your work, the fundamentals are the same: care about the details, and the details will take care of you.' },
]

export const posts: Post[] = [
  {
    slug: 'pricing-ai-built-templates',
    title: 'How to price your AI-built templates',
    excerpt: 'We analyzed 500+ sales to figure out which pricing strategies actually convert — and which quietly kill your revenue.',
    category: 'Selling',
    author: 'Mira Chen', authorRole: 'Head of Creator Success',
    date: '2026-06-28', readTime: '7 min read',
    gradient: 'from-indigo-500 via-violet-500 to-fuchsia-500', featured: true,
    content: body('Pricing digital products'),
  },
  {
    slug: 'first-product-guide',
    title: 'A complete guide to selling your first product',
    excerpt: 'From connecting GitHub to your first payout — everything you need to go live on AIAppsBase this weekend.',
    category: 'Guides',
    author: 'Alex Rivera', authorRole: 'Founder',
    date: '2026-06-20', readTime: '10 min read',
    gradient: 'from-sky-500 via-cyan-500 to-emerald-500', featured: true,
    content: body('Selling your first product'),
  },
  {
    slug: 'github-native-delivery',
    title: 'How GitHub-native delivery works under the hood',
    excerpt: 'Instant, secure delivery without the busywork. Here is exactly what happens when a buyer clicks purchase.',
    category: 'Engineering',
    author: 'Dev Patel', authorRole: 'Engineering',
    date: '2026-06-12', readTime: '6 min read',
    gradient: 'from-amber-500 via-orange-500 to-rose-500',
    content: body('GitHub-native delivery'),
  },
  {
    slug: 'design-systems-that-sell',
    title: 'Design systems that sell: lessons from top UI kits',
    excerpt: 'What the highest-rated component libraries on the marketplace all have in common.',
    category: 'Design',
    author: 'Sofia Marín', authorRole: 'Design Lead',
    date: '2026-06-04', readTime: '8 min read',
    gradient: 'from-fuchsia-500 via-pink-500 to-rose-500',
    content: body('Design systems'),
  },
  {
    slug: 'buyer-protection-explained',
    title: 'Buyer protection, explained',
    excerpt: 'How our 14-day protection window and dispute mediation keep the marketplace fair for everyone.',
    category: 'Trust',
    author: 'Aisha Khan', authorRole: 'Trust & Safety',
    date: '2026-05-27', readTime: '5 min read',
    gradient: 'from-emerald-500 via-teal-500 to-cyan-500',
    content: body('Buyer protection'),
  },
  {
    slug: 'ship-saas-in-a-weekend',
    title: 'How to ship a SaaS in a weekend',
    excerpt: 'A practical playbook for going from boilerplate to launched product in 48 hours.',
    category: 'Guides',
    author: 'Jordan Blake', authorRole: 'Indie hacker',
    date: '2026-05-18', readTime: '9 min read',
    gradient: 'from-violet-500 via-purple-500 to-indigo-500',
    content: body('Shipping a SaaS fast'),
  },
]

export const getPost = (slug: string) => posts.find((p) => p.slug === slug)
export const blogCategories = Array.from(new Set(posts.map((p) => p.category)))
