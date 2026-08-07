/**
 * Shared SEO helpers: the canonical site URL and JSON-LD schema builders used
 * by landing pages, the blog, and the product detail page. Keeping the
 * builders here (rather than inline per page) means every page emits schema
 * in the same shape and only one place needs updating if that shape changes.
 */

export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://aiappsbase.dev'
export const SITE_NAME = 'AIAppsBase'

/** Resolve a site-relative path to an absolute URL. Pass-through for absolute URLs. */
export function absoluteUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path
  return `${APP_URL}${path.startsWith('/') ? path : `/${path}`}`
}

/** UUID v4-ish pattern used to pull the real product id back out of a slugged URL segment. */
const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 60)
}

/** Canonical `/product/{slug}-{id}` path for a listing — keyword-rich but still id-addressable. */
export function productPath(repo: { id: string; title: string }): string {
  return `/product/${slugify(repo.title || 'product')}-${repo.id}`
}

/** Extracts the underlying UUID from a `/product/[id]` route param, whether it's a bare id or a slugged one. */
export function extractProductId(param: string): string {
  const match = param.match(UUID_RE)
  return match ? match[0] : param
}

export type BreadcrumbEntry = { label: string; href: string }

export function breadcrumbSchema(items: BreadcrumbEntry[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.label,
      item: absoluteUrl(item.href),
    })),
  }
}

export type FaqEntry = { q: string; a: string }

export function faqSchema(items: FaqEntry[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  }
}

export function articleSchema(opts: {
  headline: string
  description: string
  slug: string
  datePublished: string
  dateModified: string
  authorName: string
  section?: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: opts.headline,
    description: opts.description,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': absoluteUrl(`/blog/${opts.slug}`),
    },
    datePublished: opts.datePublished,
    dateModified: opts.dateModified,
    author: { '@type': 'Person', name: opts.authorName },
    publisher: { '@type': 'Organization', name: SITE_NAME, url: APP_URL },
    ...(opts.section ? { articleSection: opts.section } : {}),
  }
}

export function softwareApplicationSchema(opts: {
  name: string
  description: string
  category: string
  url: string
  price?: number
  ratingValue?: number
  ratingCount?: number
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: opts.name,
    description: opts.description,
    applicationCategory: opts.category,
    url: absoluteUrl(opts.url),
    ...(opts.price != null
      ? {
          offers: {
            '@type': 'Offer',
            price: opts.price,
            priceCurrency: 'USD',
          },
        }
      : {}),
    ...(opts.ratingValue && opts.ratingCount
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: opts.ratingValue,
            ratingCount: opts.ratingCount,
          },
        }
      : {}),
  }
}

export function collectionPageSchema(opts: { name: string; description: string; url: string }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: opts.name,
    description: opts.description,
    url: absoluteUrl(opts.url),
  }
}
