/**
 * Shared /products filter model: the `Filters` shape, the predicate that
 * decides whether a product matches, and the two-way mapping to URL search
 * params. Pure and isomorphic (no DB, no React) so both the server page
 * (`app/products/page.tsx`, which filters + paginates the catalog) and the
 * client toolbar (which only needs to read/write the URL) share one
 * definition of what a filter is and how it round-trips through the URL.
 */

import type { Repo } from '@/lib/marketplace-config'

export const MAX_PRICE = 150
export const PRODUCTS_PER_PAGE = 12

export type Filters = {
  q: string
  categories: string[]
  subcategories: string[]
  languages: string[]
  licenses: string[]
  techs: string[]
  price: [number, number]
  minStars: number
  verified: boolean
  featured: boolean
  trending: boolean
  freeOnly: boolean
}

export const emptyFilters = (init?: Partial<Filters>): Filters => ({
  q: '', categories: [], subcategories: [], languages: [], licenses: [], techs: [],
  price: [0, MAX_PRICE], minStars: 0,
  verified: false, featured: false, trending: false, freeOnly: false,
  ...init,
})

/** Whether a product passes every active facet filter (search text is ranked separately). */
export function matchesFilters(p: Repo, filters: Filters): boolean {
  if (filters.categories.length && !filters.categories.includes(p.categorySlug)) return false
  if (filters.subcategories.length && !filters.subcategories.includes(p.subcategorySlug)) return false
  if (filters.languages.length && !filters.languages.includes(p.language)) return false
  if (filters.licenses.length && !filters.licenses.includes(p.license)) return false
  if (filters.techs.length && !filters.techs.some((t) => p.techStack.includes(t))) return false
  if (p.price < filters.price[0] || (filters.price[1] < MAX_PRICE && p.price > filters.price[1])) return false
  if (filters.freeOnly && p.price !== 0) return false
  if (p.stars < filters.minStars) return false
  if (filters.verified && !p.verified) return false
  if (filters.featured && !p.featured) return false
  if (filters.trending && !p.trending) return false
  return true
}

const csv = (v: string | null) => (v ? v.split(',').filter(Boolean) : [])
const toCsv = (v: string[]) => (v.length ? v.join(',') : undefined)

/** Reads a `Filters` (+ sort, page) back out of a `URLSearchParams` (works for both the server `searchParams` prop and client-side `URLSearchParams`). */
export function filtersFromParams(sp: URLSearchParams): { filters: Filters; sort: string; page: number } {
  const priceMin = Number(sp.get('priceMin'))
  const priceMax = Number(sp.get('priceMax'))
  const minStars = Number(sp.get('minStars'))
  const page = Math.max(1, Math.floor(Number(sp.get('page'))) || 1)

  const filters = emptyFilters({
    q: sp.get('q') ?? '',
    categories: csv(sp.get('category')),
    subcategories: csv(sp.get('subcategory')),
    languages: csv(sp.get('lang')),
    licenses: csv(sp.get('license')),
    techs: csv(sp.get('tech')),
    price: [
      Number.isFinite(priceMin) && priceMin > 0 ? priceMin : 0,
      Number.isFinite(priceMax) && priceMax > 0 ? priceMax : MAX_PRICE,
    ],
    minStars: Number.isFinite(minStars) && minStars > 0 ? minStars : 0,
    verified: sp.get('verified') === 'true',
    featured: sp.get('featured') === 'true',
    trending: sp.get('trending') === 'true',
    freeOnly: sp.get('free') === 'true',
  })

  const sort = sp.get('sort') || 'recommended'
  return { filters, sort, page }
}

/** Inverse of `filtersFromParams`: builds the query string for a given filter/sort/page state, omitting defaults so URLs stay clean and shareable. */
export function paramsFromFilters(filters: Filters, sort: string, page: number): URLSearchParams {
  const sp = new URLSearchParams()
  if (filters.q) sp.set('q', filters.q)
  const cat = toCsv(filters.categories); if (cat) sp.set('category', cat)
  const subcat = toCsv(filters.subcategories); if (subcat) sp.set('subcategory', subcat)
  const lang = toCsv(filters.languages); if (lang) sp.set('lang', lang)
  const lic = toCsv(filters.licenses); if (lic) sp.set('license', lic)
  const tech = toCsv(filters.techs); if (tech) sp.set('tech', tech)
  if (filters.price[0] > 0) sp.set('priceMin', String(filters.price[0]))
  if (filters.price[1] < MAX_PRICE) sp.set('priceMax', String(filters.price[1]))
  if (filters.minStars > 0) sp.set('minStars', String(filters.minStars))
  if (filters.verified) sp.set('verified', 'true')
  if (filters.featured) sp.set('featured', 'true')
  if (filters.trending) sp.set('trending', 'true')
  if (filters.freeOnly) sp.set('free', 'true')
  if (sort && sort !== 'recommended') sp.set('sort', sort)
  if (page > 1) sp.set('page', String(page))
  return sp
}

export function activeFilterCount(filters: Filters): number {
  return (
    filters.categories.length + filters.subcategories.length + filters.languages.length +
    filters.licenses.length + filters.techs.length +
    (filters.verified ? 1 : 0) + (filters.featured ? 1 : 0) + (filters.trending ? 1 : 0) + (filters.freeOnly ? 1 : 0) +
    (filters.minStars > 0 ? 1 : 0) + (filters.price[0] > 0 || filters.price[1] < MAX_PRICE ? 1 : 0)
  )
}
