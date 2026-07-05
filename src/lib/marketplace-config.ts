/**
 * Static marketplace configuration (filter enums, gradients) and the shared
 * types used by the marketplace + product pages. This is configuration, not
 * data — the actual listings/sellers/reviews are loaded from the database in
 * src/lib/products.ts.
 */

export const CATEGORIES = [
  { name: 'SaaS Boilerplates', slug: 'saas' },
  { name: 'Templates', slug: 'templates' },
  { name: 'Components', slug: 'components' },
  { name: 'Dashboards', slug: 'dashboards' },
  { name: 'AI Projects', slug: 'ai' },
  { name: 'E-commerce', slug: 'ecommerce' },
  { name: 'Mobile Apps', slug: 'mobile' },
  { name: 'Chrome Extensions', slug: 'extensions' },
  { name: 'Scripts & Tools', slug: 'scripts' },
  { name: 'Portfolio', slug: 'portfolio' },
] as const

export const LANGUAGES = [
  { name: 'TypeScript', color: '#3178c6' },
  { name: 'JavaScript', color: '#f1e05a' },
  { name: 'Python', color: '#3776ab' },
  { name: 'Dart', color: '#00b4ab' },
  { name: 'Go', color: '#00add8' },
  { name: 'Ruby', color: '#701516' },
  { name: 'PHP', color: '#4f5d95' },
  { name: 'Rust', color: '#dea584' },
]

export const TECHS = [
  'Next.js', 'React', 'Vue', 'Svelte', 'Node.js', 'Python', 'Django', 'Laravel',
  'Flutter', 'React Native', 'Tailwind', 'Prisma', 'tRPC', 'Stripe', 'Supabase',
  'PostgreSQL', 'MongoDB', 'GraphQL', 'Redis', 'Docker',
]

export const LICENSES = ['MIT', 'Personal', 'Commercial', 'Extended', 'Extended Commercial'] as const

export const GRADIENTS = [
  'from-indigo-500 via-violet-500 to-fuchsia-500',
  'from-sky-500 via-cyan-500 to-emerald-500',
  'from-amber-500 via-orange-500 to-rose-500',
  'from-emerald-500 via-teal-500 to-cyan-500',
  'from-fuchsia-500 via-pink-500 to-rose-500',
  'from-violet-500 via-purple-500 to-indigo-500',
  'from-blue-500 via-indigo-500 to-violet-500',
  'from-rose-500 via-red-500 to-orange-500',
]

/** Deterministic gradient for a product id, so covers are stable & varied. */
export function gradientFor(id: string): string {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return GRADIENTS[h % GRADIENTS.length]
}

export function slugifyCategory(name: string): string {
  const found = CATEGORIES.find((c) => c.name.toLowerCase() === name.toLowerCase())
  if (found) return found.slug
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export function languageColor(lang?: string | null): string {
  if (!lang) return '#8b949e'
  return LANGUAGES.find((l) => l.name.toLowerCase() === lang.toLowerCase())?.color ?? '#8b949e'
}

/* --------------------------------- Types -------------------------------- */
export type Review = {
  id: string
  author: string
  avatar: string
  rating: number
  title: string
  body: string
  date: string
  helpful: number
  verified: boolean
}

export type ChangelogEntry = { version: string; date: string; notes: string[] }

export type Seller = {
  id: string
  name: string
  handle: string
  avatar: string
  bio: string
  badge: string
  verified: boolean
  rating: number
  sales: number
  productCount: number
  followers: number
  joinedAt: string
  location: string
  gradient: string
}

export type Repo = {
  id: string
  name: string
  owner: string
  title: string
  description: string
  longDescription: string
  price: number
  originalPrice?: number
  category: string
  categorySlug: string
  language: string
  languageColor: string
  techStack: string[]
  aiTool: string
  tags: string[]
  license: string
  stars: number
  forks: number
  issues: number
  watchers: number
  commits: number
  contributors: number
  rating: number
  reviewCount: number
  sales: number
  featured: boolean
  trending: boolean
  verified: boolean
  isNew: boolean
  createdAt: string
  updatedAt: string
  version: string
  gradient: string
  demoUrl: string
  repoUrl: string
  sellerId: string
  features: string[]
  changelog: ChangelogEntry[]
  reviews: Review[]
}
