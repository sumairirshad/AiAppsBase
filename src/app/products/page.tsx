import type { Metadata } from 'next'
import { MarketplaceClient } from '@/components/marketplace/marketplace-client'
import { CATEGORIES } from '@/lib/marketplace-data'

export const metadata: Metadata = {
  title: 'Marketplace — Browse AI-built projects & repos',
  description:
    'Browse production-ready websites, SaaS boilerplates, UI kits, dashboards, and mobile apps. Filter by category, tech stack, language, price, and more.',
}

type SP = Record<string, string | string[] | undefined>
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)

export default function ProductsPage({ searchParams }: { searchParams: SP }) {
  const categorySlug = one(searchParams.category)
  const validCat = CATEGORIES.find((c) => c.slug === categorySlug)?.slug
  const tech = one(searchParams.tech)
  const q = one(searchParams.q)
  const featured = one(searchParams.featured) === 'true'

  return (
    <MarketplaceClient
      initial={{
        q: q ?? '',
        categories: validCat ? [validCat] : [],
        techs: tech ? [decodeURIComponent(tech)] : [],
        featured,
      }}
    />
  )
}
