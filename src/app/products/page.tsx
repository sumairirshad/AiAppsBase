import type { Metadata } from 'next'
import { MarketplaceClient } from '@/components/marketplace/marketplace-client'
import { filtersFromParams } from '@/lib/marketplace-filters'
import { getProductsPage } from '@/lib/ranking/service'

export const metadata: Metadata = {
  title: 'Marketplace — Browse AI-built projects & repos',
  description:
    'Browse production-ready websites, SaaS boilerplates, UI kits, dashboards, and mobile apps. Filter by category, tech stack, language, price, and more.',
  alternates: { canonical: '/products' },
}

export const revalidate = 300

type SP = Record<string, string | string[] | undefined>

export default async function ProductsPage({ searchParams }: { searchParams: SP }) {
  // Next hands us a plain object; URLSearchParams gives filtersFromParams a single, isomorphic reader.
  const sp = new URLSearchParams()
  for (const [key, value] of Object.entries(searchParams)) {
    const v = Array.isArray(value) ? value[0] : value
    if (v !== undefined) sp.set(key, v)
  }

  const { filters, sort, page } = filtersFromParams(sp)

  // Server-side pagination: only this page's products (and therefore only
  // their images) are fetched and sent to the client — never the full catalog.
  const result = await getProductsPage({ filters, sort, page })

  return (
    <MarketplaceClient
      // Remount when the URL changes so filter controls resync with the new params.
      key={sp.toString()}
      products={result.products}
      total={result.total}
      totalPages={result.totalPages}
      page={result.page}
      sort={sort}
      filters={filters}
    />
  )
}
