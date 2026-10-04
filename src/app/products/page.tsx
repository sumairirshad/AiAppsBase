import type { Metadata } from 'next'
import { MarketplaceClient } from '@/components/marketplace/marketplace-client'
import { CATEGORIES, ALL_SUBCATEGORIES, SORT_VALUES } from '@/lib/marketplace-config'
import { getDiscoveryRanking } from '@/lib/ranking/service'

export const metadata: Metadata = {
  title: 'Marketplace — Browse AI-built projects & repos',
  description:
    'Browse production-ready websites, SaaS boilerplates, UI kits, dashboards, and mobile apps. Filter by category, tech stack, language, price, and more.',
  alternates: { canonical: '/products' },
}

export const revalidate = 300

type SP = Record<string, string | string[] | undefined>
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)

export default async function ProductsPage({ searchParams }: { searchParams: SP }) {
  // Ranked + seller-diversified discovery order (not newest-first).
  const products = (await getDiscoveryRanking()).map((r) => r.product)

  const categorySlug = one(searchParams.category)
  const validCat = CATEGORIES.find((c) => c.slug === categorySlug)?.slug
  const subcategorySlug = one(searchParams.subcategory)
  const validSubcat = ALL_SUBCATEGORIES.find((s) => s.slug === subcategorySlug)?.slug
  const tech = one(searchParams.tech)
  const q = one(searchParams.q)
  const featured = one(searchParams.featured) === 'true'
  const sortParam = one(searchParams.sort) === 'new' ? 'newest' : one(searchParams.sort)
  const initialSort = sortParam && SORT_VALUES.includes(sortParam) ? sortParam : 'recommended'

  return (
    <MarketplaceClient
      // Remount when the URL changes (e.g. a new header search) so the filters pick up the new params.
      key={JSON.stringify(searchParams)}
      products={products}
      initialSort={initialSort}
      initial={{
        q: q ?? '',
        categories: validCat ? [validCat] : [],
        subcategories: validSubcat ? [validSubcat] : [],
        techs: tech ? [decodeURIComponent(tech)] : [],
        featured,
      }}
    />
  )
}
