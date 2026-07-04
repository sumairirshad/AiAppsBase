/**
 * Deterministic demo marketplace dataset.
 *
 * Generates a realistic, stable catalog (sellers, repositories, reviews,
 * changelogs) at import time using a seeded PRNG, so the marketplace and
 * product pages render fully populated without a database. The companion
 * `scripts/seed.js` inserts an equivalent dataset into Postgres for prod.
 */

/* ----------------------------- PRNG ----------------------------- */
function mulberry32(seed: number) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rand = mulberry32(20260704)
const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)]
const pickN = <T,>(arr: T[], n: number) => {
  const copy = [...arr]
  const out: T[] = []
  for (let i = 0; i < n && copy.length; i++) out.push(copy.splice(Math.floor(rand() * copy.length), 1)[0])
  return out
}
const int = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min
const round2 = (n: number) => Math.round(n * 100) / 100

/* --------------------------- Constants -------------------------- */
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

export const AI_TOOLS = ['Claude', 'ChatGPT', 'v0', 'Bolt', 'Cursor', 'Lovable', 'Windsurf']
export const LICENSES = ['MIT', 'Personal', 'Commercial', 'Extended'] as const

const GRADIENTS = [
  'from-indigo-500 via-violet-500 to-fuchsia-500',
  'from-sky-500 via-cyan-500 to-emerald-500',
  'from-amber-500 via-orange-500 to-rose-500',
  'from-emerald-500 via-teal-500 to-cyan-500',
  'from-fuchsia-500 via-pink-500 to-rose-500',
  'from-violet-500 via-purple-500 to-indigo-500',
  'from-blue-500 via-indigo-500 to-violet-500',
  'from-rose-500 via-red-500 to-orange-500',
]

const ADJ = ['Nexus', 'Orbit', 'Quantum', 'Aurora', 'Pulse', 'Vertex', 'Lumen', 'Cobalt', 'Zenith', 'Nova', 'Echo', 'Flux', 'Prism', 'Atlas', 'Halo', 'Onyx', 'Cipher', 'Drift', 'Ember', 'Comet']
const NOUN = ['Starter', 'Kit', 'Studio', 'Stack', 'Board', 'Suite', 'Flow', 'Grid', 'Forge', 'Craft', 'Base', 'Deck', 'Hub', 'Lab', 'Works', 'Engine']

const SELLER_NAMES = [
  'Alex Rivera', 'Mira Chen', 'Dev Patel', 'Sofia Marín', 'Jordan Blake', 'Priya Nair',
  'Marco Rossi', 'Hannah Wu', 'Tom Fisher', 'Aisha Khan', 'Leo Novak', 'Yuki Tanaka',
  'Elena Petrova', 'Sam Okafor', 'Nina Larsson', 'Omar Haddad', 'Grace Lee', 'Diego Torres',
  'Freya Berg', 'Ravi Menon', 'Clara Dupont', 'Ken Adams', 'Lucia Ferro', 'Noah Brooks',
  'Amara Diallo', 'Ivan Kovač', 'Maya Suzuki', 'Ethan Cole', 'Zara Ahmed', 'Felix Braun',
]
const SELLER_HANDLES = [
  'aurelia', 'lumen-labs', 'stric', 'monogram', 'jblake', 'loop', 'rossi-dev', 'draftly',
  'northwind', 'aisha-codes', 'novak', 'yuki', 'petrova', 'okafor', 'larsson', 'haddad',
  'gracely', 'dtorres', 'freyb', 'menon', 'cdupont', 'kadams', 'ferro', 'nbrooks',
  'amara', 'kovac', 'mayasz', 'ecole', 'zahmed', 'fbraun',
]
const BADGES = ['Top Seller', 'Power Author', 'Rising Star', 'Verified', 'Elite Partner']
const LOCATIONS = ['San Francisco, US', 'Berlin, DE', 'Toronto, CA', 'London, UK', 'Bengaluru, IN', 'Tokyo, JP', 'Lisbon, PT', 'Sydney, AU', 'Amsterdam, NL', 'Austin, US']

const REVIEW_TITLES = ['Exactly what I needed', 'Production-ready out of the box', 'Saved me weeks', 'Clean, documented code', 'Worth every penny', 'Impressive quality', 'Great support', 'Highly recommend', 'Solid foundation', 'Beautiful and fast']
const REVIEW_BODIES = [
  'The code quality is genuinely excellent — well structured, typed, and easy to extend. Documentation walked me through setup in minutes.',
  'I shipped my MVP in a weekend thanks to this. Everything just worked, and the seller answered my questions fast.',
  'Beautiful UI and thoughtful architecture. This is clearly built by someone who ships real products.',
  'Saved my team a huge amount of setup time. The GitHub sync and instant delivery made it painless.',
  'Honestly better than some paid frameworks I have used. Clean commits, sensible defaults, zero bloat.',
  'Great value. The design is modern and the components are reusable. A few tweaks and it was on brand.',
  'Documentation could go deeper in places, but overall a fantastic starting point that I keep reusing.',
  'Exceeded expectations. Responsive on every screen and the dark mode is gorgeous.',
]
const REVIEWERS = ['Chris M.', 'Dana K.', 'Sam P.', 'Riley T.', 'Jordan F.', 'Casey L.', 'Morgan R.', 'Avery S.', 'Quinn B.', 'Reese W.', 'Taylor N.', 'Jamie H.']

/* --------------------------- Types ------------------------------ */
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

/* ------------------------- Generation --------------------------- */
function avatarFor(seed: string) {
  return `https://api.dicebear.com/7.x/glass/svg?seed=${encodeURIComponent(seed)}`
}

export const sellers: Seller[] = SELLER_NAMES.map((name, i) => {
  const productCount = int(4, 28)
  return {
    id: `seller-${i + 1}`,
    name,
    handle: SELLER_HANDLES[i],
    avatar: avatarFor(SELLER_HANDLES[i]),
    bio: pick([
      'Building developer tools and beautiful SaaS starters.',
      'Design systems, UI kits, and pixel-perfect templates.',
      'Full-stack engineer shipping production-ready code.',
      'Data dashboards, analytics, and internal tooling.',
      'AI-native apps and automation for modern teams.',
    ]),
    badge: pick(BADGES),
    verified: rand() > 0.35,
    rating: round2(4.4 + rand() * 0.6),
    sales: int(120, 8200),
    productCount,
    followers: int(80, 12000),
    joinedAt: `202${int(2, 5)}-0${int(1, 9)}-1${int(0, 9)}`,
    location: pick(LOCATIONS),
    gradient: GRADIENTS[i % GRADIENTS.length],
  }
})

const FEATURE_POOL = [
  'Fully responsive across mobile, tablet, and desktop',
  'Dark and light mode with system detection',
  'Type-safe end to end with TypeScript',
  'Authentication and role-based access control',
  'Stripe billing with subscriptions and webhooks',
  'SEO optimized with metadata and Open Graph',
  'Accessible components (WCAG 2.1 AA)',
  'One-command local setup with sensible defaults',
  'CI/CD workflow and Docker configuration included',
  'Comprehensive documentation and code comments',
  'Reusable, composable component library',
  'Optimistic UI with server-state caching',
  'Email templates and transactional sending',
  'Internationalization (i18n) ready',
]

function makeReviews(baseRating: number, count: number, idPrefix: string): Review[] {
  const n = Math.min(count, int(3, 6))
  return Array.from({ length: n }).map((_, i) => {
    const r = Math.max(3, Math.min(5, Math.round(baseRating + (rand() - 0.4))))
    const author = pick(REVIEWERS)
    return {
      id: `${idPrefix}-rev-${i + 1}`,
      author,
      avatar: avatarFor(author + i),
      rating: r,
      title: pick(REVIEW_TITLES),
      body: pick(REVIEW_BODIES),
      date: `2026-0${int(1, 6)}-1${int(0, 9)}`,
      helpful: int(0, 64),
      verified: rand() > 0.2,
    }
  })
}

function makeChangelog(version: string): ChangelogEntry[] {
  const major = parseInt(version.split('.')[0])
  const entries: ChangelogEntry[] = []
  for (let v = major; v >= Math.max(1, major - 2); v--) {
    entries.push({
      version: `${v}.${int(0, 4)}.${int(0, 9)}`,
      date: `2026-0${int(1, 6)}-${int(10, 28)}`,
      notes: pickN([
        'Added new dashboard analytics view',
        'Upgraded to the latest framework version',
        'Improved dark mode contrast and accessibility',
        'Fixed edge cases in the checkout flow',
        'Performance: reduced bundle size by 18%',
        'New CLI for scaffolding pages',
        'Refined mobile navigation and gestures',
      ], int(2, 3)),
    })
  }
  return entries
}

const usedNames = new Set<string>()
function uniqueRepoName(): { name: string; title: string } {
  for (let tries = 0; tries < 50; tries++) {
    const a = pick(ADJ)
    const n = pick(NOUN)
    const slug = `${a.toLowerCase()}-${n.toLowerCase()}`
    if (!usedNames.has(slug)) {
      usedNames.add(slug)
      return { name: slug, title: `${a} ${n}` }
    }
  }
  const fallback = `${pick(ADJ).toLowerCase()}-${Date.now()}`
  return { name: fallback, title: fallback }
}

const CATEGORY_BLURB: Record<string, string> = {
  saas: 'A production-ready SaaS boilerplate with auth, billing, and a polished dashboard.',
  templates: 'A beautifully designed, fully responsive template you can ship today.',
  components: 'A crafted component library with dark mode and accessibility built in.',
  dashboards: 'A real-time analytics dashboard with rich charts and reporting.',
  ai: 'An AI-native application with streaming, tools, and a delightful UX.',
  ecommerce: 'A headless commerce storefront with cart, checkout, and subscriptions.',
  mobile: 'A cross-platform mobile app with native performance and clean architecture.',
  extensions: 'A polished Chrome extension that solves a real workflow problem.',
  scripts: 'A handy script/tool that automates a tedious developer task.',
  portfolio: 'A cinematic portfolio with smooth motion and perfect Lighthouse scores.',
}

export const products: Repo[] = Array.from({ length: 54 }).map((_, i) => {
  const cat = CATEGORIES[i % CATEGORIES.length]
  const { name, title } = uniqueRepoName()
  const seller = sellers[int(0, sellers.length - 1)]
  const lang = pick(LANGUAGES)
  const rating = round2(4.2 + rand() * 0.8)
  const reviewCount = int(6, 320)
  const isFree = rand() > 0.82
  const basePrice = isFree ? 0 : pick([19, 29, 39, 49, 59, 74, 79, 89, 99, 129, 149])
  const discounted = !isFree && rand() > 0.7
  const version = `${int(1, 5)}.${int(0, 9)}.${int(0, 9)}`
  const stars = int(120, 18000)

  return {
    id: name,
    name,
    owner: seller.handle,
    title,
    description: CATEGORY_BLURB[cat.slug],
    longDescription: `${title} is ${CATEGORY_BLURB[cat.slug].toLowerCase()} Built with a modern stack and refined with ${pick(AI_TOOLS)}, it ships with clean architecture, thorough documentation, and everything you need to go from clone to production. Every screen is responsive, themeable, and accessible — designed to feel like a product a real team would charge for.`,
    price: basePrice,
    originalPrice: discounted ? round2(basePrice * pick([1.4, 1.5, 1.8, 2])) : undefined,
    category: cat.name,
    categorySlug: cat.slug,
    language: lang.name,
    languageColor: lang.color,
    techStack: pickN(TECHS, int(3, 5)),
    aiTool: pick(AI_TOOLS),
    tags: pickN(['open-source', 'starter', 'premium', 'modern', 'minimal', 'enterprise', 'fullstack', 'realtime', 'headless'], int(2, 4)),
    license: isFree ? 'MIT' : pick(['Commercial', 'Personal', 'Extended']),
    stars,
    forks: Math.floor(stars * (0.08 + rand() * 0.12)),
    issues: int(2, 90),
    watchers: Math.floor(stars * 0.04),
    commits: int(120, 4200),
    contributors: int(1, 40),
    rating,
    reviewCount,
    sales: int(30, 4200),
    featured: rand() > 0.72,
    trending: rand() > 0.72,
    verified: seller.verified && rand() > 0.3,
    isNew: rand() > 0.8,
    createdAt: `2026-0${int(1, 6)}-${int(10, 28)}`,
    updatedAt: `2026-0${int(4, 7)}-${int(10, 28)}`,
    version,
    gradient: GRADIENTS[i % GRADIENTS.length],
    demoUrl: 'https://demo.aiappsbase.dev',
    repoUrl: `https://github.com/${seller.handle}/${name}`,
    sellerId: seller.id,
    features: pickN(FEATURE_POOL, int(6, 8)),
    changelog: makeChangelog(version),
    reviews: makeReviews(rating, reviewCount, name),
  }
})

/* --------------------------- Accessors -------------------------- */
export function getSeller(id: string) {
  return sellers.find((s) => s.id === id)
}

export function getProduct(slug: string) {
  return products.find((p) => p.id === slug)
}

export function getRelated(product: Repo, n = 3) {
  return products
    .filter((p) => p.id !== product.id && p.categorySlug === product.categorySlug)
    .slice(0, n)
    .concat(products.filter((p) => p.id !== product.id && p.categorySlug !== product.categorySlug))
    .slice(0, n)
}

export function getSellerProducts(sellerId: string) {
  return products.filter((p) => p.sellerId === sellerId)
}

export const marketplaceStats = {
  total: products.length,
  free: products.filter((p) => p.price === 0).length,
  categories: CATEGORIES.length,
  sellers: sellers.length,
}
