import type { Repo } from '@/lib/marketplace-config'

export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://aiappsbase.dev'

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
export function productPath(repo: Pick<Repo, 'id' | 'title'>): string {
  const slug = slugify(repo.title || 'product')
  return `/product/${slug}-${repo.id}`
}

export function absoluteUrl(path: string): string {
  return `${APP_URL}${path.startsWith('/') ? path : `/${path}`}`
}

/** Extracts the underlying UUID from a `/product/[id]` route param, whether it's a bare id or a slugged one. */
export function extractProductId(param: string): string {
  const match = param.match(UUID_RE)
  return match ? match[0] : param
}

export function productJsonLd(repo: Repo, seller?: { name: string } | null) {
  const url = absoluteUrl(productPath(repo))
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: repo.title,
    description: repo.description,
    url,
    category: repo.category,
    brand: seller ? { '@type': 'Brand', name: seller.name } : undefined,
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: 'USD',
      price: repo.price.toFixed(2),
      availability: 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
    },
    ...(repo.reviewCount > 0
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: repo.rating.toFixed(1),
            reviewCount: repo.reviewCount,
          },
        }
      : {}),
  }
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  }
}

export function articleJsonLd(post: {
  title: string
  excerpt: string
  date: string
  author: string
  slug: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    author: { '@type': 'Person', name: post.author },
    publisher: { '@type': 'Organization', name: 'AIAppsBase' },
    mainEntityOfPage: absoluteUrl(`/blog/${post.slug}`),
  }
}

export function faqJsonLd(faqs: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  }
}

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'AIAppsBase',
    url: APP_URL,
    logo: absoluteUrl('/icon'),
    sameAs: [],
  }
}

export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'AIAppsBase',
    url: APP_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${APP_URL}/products?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
}
