import type { Metadata } from 'next'
import { MarketplaceClient } from '@/components/marketplace/marketplace-client'
import { Breadcrumbs } from '@/components/seo/breadcrumbs'
import { filtersFromParams, MAX_PRICE, type Filters } from '@/lib/marketplace-filters'
import { getProductsPage } from '@/lib/ranking/service'
import { CATEGORIES } from '@/lib/marketplace-config'

export const revalidate = 300

type SP = Record<string, string | string[] | undefined>

const DEFAULT_TITLE = 'Marketplace — Browse the Best AI Apps & Projects'
const DEFAULT_DESCRIPTION =
  'Browse production-ready AI apps — websites, SaaS boilerplates, UI kits, dashboards, and mobile apps. Filter by category, tech stack, language, and price to find the best AI apps for your next project.'

function toSearchParams(searchParams: SP): URLSearchParams {
  const sp = new URLSearchParams()
  for (const [key, value] of Object.entries(searchParams)) {
    const v = Array.isArray(value) ? value[0] : value
    if (v !== undefined) sp.set(key, v)
  }
  return sp
}

/** True when any facet besides `category` is active — i.e. this isn't a plain category landing view. */
function hasNonCategoryFacets(filters: Filters): boolean {
  return Boolean(
    filters.q || filters.subcategories.length || filters.languages.length ||
    filters.licenses.length || filters.techs.length || filters.verified ||
    filters.featured || filters.trending || filters.freeOnly || filters.minStars > 0 ||
    filters.price[0] > 0 || filters.price[1] < MAX_PRICE
  )
}

export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  const sp = toSearchParams(searchParams)
  const { filters, page } = filtersFromParams(sp)

  // A single named category and nothing else is a real, valuable landing
  // view (e.g. "Websites AI apps") — give it its own indexable title,
  // description and canonical. Everything else (search queries, multi-facet
  // combinations, price/stars/toggle filters) is a thin or duplicate variant
  // of the same catalog, so it consolidates back to the base listing and is
  // kept out of the index rather than spamming Google with near-duplicates.
  const singleCategory = filters.categories.length === 1 ? CATEGORIES.find((c) => c.slug === filters.categories[0]) : null
  const isCategoryLanding = Boolean(singleCategory) && !hasNonCategoryFacets(filters)

  if (singleCategory && isCategoryLanding) {
    const canonical = `/products?category=${singleCategory.slug}`
    return {
      title: `${singleCategory.name} AI Apps & Templates`,
      description: `Browse ${singleCategory.name} — AI-built apps and templates you can explore, buy, and deploy. Discover the best AI apps in this category on AIAppsBase.`,
      alternates: { canonical },
      // Page 1 of a category is worth indexing; deeper pages are thin slices of the same list.
      ...(page > 1 ? { robots: { index: false, follow: true } } : {}),
    }
  }

  const isFiltered = Boolean(
    filters.q || filters.categories.length || filters.subcategories.length ||
    filters.languages.length || filters.licenses.length || filters.techs.length ||
    filters.verified || filters.featured || filters.trending || filters.freeOnly ||
    filters.minStars > 0 || filters.price[0] > 0 || filters.price[1] < MAX_PRICE
  )

  return {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    alternates: { canonical: '/products' },
    // A search query, any non-category facet combo, or page 2+ is a
    // near-duplicate slice of the main catalog — crawlable (so links inside
    // are still discovered) but not indexed on its own.
    ...(isFiltered || page > 1 ? { robots: { index: false, follow: true } } : {}),
  }
}

export default async function ProductsPage({ searchParams }: { searchParams: SP }) {
  const sp = toSearchParams(searchParams)
  const { filters, sort, page } = filtersFromParams(sp)

  // Server-side pagination: only this page's products (and therefore only
  // their images) are fetched and sent to the client — never the full catalog.
  const result = await getProductsPage({ filters, sort, page })

  const singleCategory = filters.categories.length === 1 ? CATEGORIES.find((c) => c.slug === filters.categories[0]) : null

  return (
    <>
      <div className="container pt-6">
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Marketplace', href: '/products' },
            ...(singleCategory ? [{ label: singleCategory.name, href: `/products?category=${singleCategory.slug}` }] : []),
          ]}
          className="mb-0 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground"
        />
      </div>
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
    </>
  )
}
