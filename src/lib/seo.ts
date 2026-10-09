/**
 * Shared SEO helpers: the canonical site URL and JSON-LD schema builders used
 * by landing pages, the blog, and the product detail page. Keeping the
 * builders here (rather than inline per page) means every page emits schema
 * in the same shape and only one place needs updating if that shape changes.
 */

export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://aiappsbase.dev'
export const SITE_NAME = 'AIAppsBase'

/** Shared brand/organization description — one place so Organization JSON-LD and fallback copy never drift. */
export const SITE_DESCRIPTION =
  'AIAppsBase is an AI apps marketplace where you can discover, explore, and get the best AI apps and artificial intelligence applications — websites, web apps, mobile apps, and UI components — built with tools like ChatGPT, Claude, v0, Bolt, Cursor, and Lovable.'

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

/** Public @handle for a seller: their GitHub username, else the first word of their name. */
export function sellerHandle(u: { github_username?: string | null; full_name?: string | null }): string {
  return u.github_username || String(u.full_name || 'seller').split(' ')[0].toLowerCase()
}

/** Canonical `/seller/{handle}-{id}` storefront path. Handles aren't unique, so the id stays in the URL. */
export function sellerPath(seller: { id: string; handle?: string; name?: string }): string {
  return `/seller/${slugify(seller.handle || seller.name || 'seller') || 'seller'}-${seller.id}`
}

/** Extracts the underlying UUID from a `/product/[id]` or `/seller/[id]` route param, whether it's a bare id or a slugged one. */
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

/**
 * Product/listing structured data. Every field is optional except the
 * basics — callers should only pass `price`/`ratingValue`+`ratingCount` when
 * those are real values from the database (0 reviews => omit rating
 * entirely; never invent a rating or review count).
 */
export function softwareApplicationSchema(opts: {
  name: string
  description: string
  category: string
  url: string
  image?: string
  brandName?: string
  price?: number
  currency?: string
  /** Defaults to 'InStock' — every listing passed here is a live, purchasable product. */
  availability?: 'InStock' | 'OutOfStock' | 'PreOrder'
  ratingValue?: number
  ratingCount?: number
  keywords?: string[]
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: opts.name,
    description: opts.description,
    applicationCategory: opts.category,
    url: absoluteUrl(opts.url),
    ...(opts.image ? { image: absoluteUrl(opts.image) } : {}),
    ...(opts.brandName ? { brand: { '@type': 'Brand', name: opts.brandName } } : {}),
    ...(opts.keywords && opts.keywords.length ? { keywords: opts.keywords.join(', ') } : {}),
    ...(opts.price != null
      ? {
          offers: {
            '@type': 'Offer',
            price: opts.price,
            priceCurrency: opts.currency || 'USD',
            availability: `https://schema.org/${opts.availability || 'InStock'}`,
            url: absoluteUrl(opts.url),
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

export function sellerProfileSchema(opts: {
  name: string
  description: string
  url: string
  sameAs?: string[]
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    url: absoluteUrl(opts.url),
    mainEntity: {
      '@type': 'Person',
      name: opts.name,
      description: opts.description,
      url: absoluteUrl(opts.url),
      ...(opts.sameAs && opts.sameAs.length ? { sameAs: opts.sameAs } : {}),
    },
  }
}

/** Site-wide Organization schema — rendered once, in the root layout. */
export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: APP_URL,
    description: SITE_DESCRIPTION,
    sameAs: [
      'https://github.com',
      'https://x.com',
      'https://discord.com',
      'https://linkedin.com',
    ],
  }
}

/** Site-wide WebSite schema with a SearchAction tied to the real /products search. */
export function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: APP_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${APP_URL}/products?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  }
}

/**
 * Fallback-safe product `<title>` (before the root layout's "%s | AIAppsBase"
 * template is appended). Always non-empty — `title` is a required DB column,
 * but this guards against blank/whitespace-only values from bad data.
 */
export function productMetaTitle(title: string): string {
  const name = (title || '').trim()
  return name ? `${name} — AI App` : 'AI App'
}

/**
 * Meta description built from the product's own description, trimmed to a
 * search-result-friendly length. Falls back to a plain, factual sentence —
 * never invented marketing copy — when a product has no description.
 */
export function productMetaDescription(opts: { title: string; description: string; category: string }): string {
  const base = (opts.description || '').trim()
  if (base) return base.length > 160 ? `${base.slice(0, 157).trimEnd()}…` : base
  const name = (opts.title || 'This product').trim()
  const category = (opts.category || '').trim()
  return category
    ? `Explore ${name}, an AI-built ${category} listing on AIAppsBase.`
    : `Explore ${name} on AIAppsBase.`
}
