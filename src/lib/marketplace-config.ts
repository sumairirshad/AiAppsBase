/**
 * Static marketplace configuration (filter enums, gradients) and the shared
 * types used by the marketplace + product pages. This is configuration, not
 * data — the actual listings/sellers/reviews are loaded from the database in
 * src/lib/products.ts.
 */

export type Subcategory = { name: string; slug: string }
export type CategoryDef = { name: string; slug: string; subcategories: Subcategory[] }

/**
 * Two-level catalog taxonomy: main category -> subcategories.
 * `products.category` stores the main category name, `products.subcategory`
 * stores the subcategory name (both plain TEXT columns; slugs are derived
 * here for filtering/URLs).
 */
export const CATEGORIES: CategoryDef[] = [
  {
    name: 'Websites', slug: 'websites',
    subcategories: [
      { name: 'Landing Pages & Marketing', slug: 'landing-pages' },
      { name: 'Portfolio Templates', slug: 'portfolio-templates' },
      { name: 'Blog & Content Sites', slug: 'blog-sites' },
    ],
  },
  {
    name: 'Web Apps & SaaS', slug: 'web-apps',
    subcategories: [
      { name: 'SaaS Boilerplates', slug: 'saas-boilerplates' },
      { name: 'Admin Dashboards', slug: 'dashboards' },
    ],
  },
  {
    name: 'AI Projects', slug: 'ai-projects',
    subcategories: [
      { name: 'LLM Apps & Agents', slug: 'llm-agents' },
      { name: 'ML & Deep Learning Frameworks', slug: 'ml-frameworks' },
    ],
  },
  {
    name: 'E-commerce', slug: 'ecommerce',
    subcategories: [
      { name: 'Storefronts', slug: 'storefronts' },
      { name: 'Headless Commerce Backends', slug: 'headless-commerce-backends' },
    ],
  },
  {
    name: 'Mobile Apps', slug: 'mobile-apps',
    subcategories: [
      { name: 'Cross-Platform (React Native / Flutter)', slug: 'cross-platform-mobile' },
      { name: 'Native iOS & Android', slug: 'native-mobile' },
    ],
  },
  {
    name: 'Components & UI Kits', slug: 'components-ui',
    subcategories: [
      { name: 'Component Libraries', slug: 'component-libraries' },
      { name: 'Design Systems & Blocks', slug: 'design-systems' },
    ],
  },
  {
    name: 'Browser Extensions', slug: 'browser-extensions',
    subcategories: [
      { name: 'Extension Boilerplates & Frameworks', slug: 'extension-boilerplates' },
      { name: 'Real-World Extensions', slug: 'real-world-extensions' },
    ],
  },
  {
    name: 'Scripts & Developer Tools', slug: 'scripts-tools',
    subcategories: [
      { name: 'CLI Tools', slug: 'cli-tools' },
      { name: 'Automation & DevOps Scripts', slug: 'automation-devops' },
    ],
  },
]

/** Flat list of all subcategories, each tagged with its parent category. */
export const ALL_SUBCATEGORIES = CATEGORIES.flatMap((c) =>
  c.subcategories.map((s) => ({ ...s, categoryName: c.name, categorySlug: c.slug }))
)

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

export const LICENSES = ['MIT', 'Apache-2.0', 'GPL-3.0', 'MPL-2.0', 'BSD-3-Clause', 'Personal', 'Commercial', 'Extended', 'Extended Commercial'] as const

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

export function slugifySubcategory(name: string): string {
  const found = ALL_SUBCATEGORIES.find((s) => s.name.toLowerCase() === name.toLowerCase())
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
  subcategory: string
  subcategorySlug: string
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
