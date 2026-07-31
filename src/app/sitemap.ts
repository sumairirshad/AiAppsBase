import type { MetadataRoute } from 'next'
import { query } from '@/lib/db'
import { posts } from '@/lib/blog-data'
import { APP_URL } from '@/lib/seo'

const staticRoutes: MetadataRoute.Sitemap = [
  {
    url: APP_URL,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 1,
  },
  {
    url: `${APP_URL}/products`,
    lastModified: new Date(),
    changeFrequency: 'hourly',
    priority: 0.9,
  },
  {
    url: `${APP_URL}/templates`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.9,
  },
  {
    url: `${APP_URL}/apps`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.9,
  },
  {
    url: `${APP_URL}/components`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.9,
  },
  {
    url: `${APP_URL}/ai-projects`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.8,
  },
  {
    url: `${APP_URL}/ecommerce`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.8,
  },
  {
    url: `${APP_URL}/mobile-apps`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.8,
  },
  {
    url: `${APP_URL}/browser-extensions`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.8,
  },
  {
    url: `${APP_URL}/developer-tools`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.8,
  },
  {
    url: `${APP_URL}/best-ai-coding-tools`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  },
  {
    url: `${APP_URL}/about`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.6,
  },
  {
    url: `${APP_URL}/blog`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.7,
  },
  {
    url: `${APP_URL}/support`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.5,
  },
  {
    url: `${APP_URL}/terms`,
    lastModified: new Date(),
    changeFrequency: 'yearly',
    priority: 0.3,
  },
  {
    url: `${APP_URL}/privacy`,
    lastModified: new Date(),
    changeFrequency: 'yearly',
    priority: 0.3,
  },
  {
    url: `${APP_URL}/cookies`,
    lastModified: new Date(),
    changeFrequency: 'yearly',
    priority: 0.3,
  },
]

const blogRoutes: MetadataRoute.Sitemap = posts.map((p) => ({
  url: `${APP_URL}/blog/${p.slug}`,
  lastModified: new Date(p.updatedAt),
  changeFrequency: 'monthly' as const,
  priority: 0.6,
}))

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let productRoutes: MetadataRoute.Sitemap = []

  try {
    const result = await query(
      `SELECT id, updated_at FROM products WHERE status = 'approved' ORDER BY updated_at DESC`
    )
    productRoutes = (result.rows || []).map((p) => ({
      url: `${APP_URL}/product/${p.id}`,
      lastModified: new Date(p.updated_at),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))
  } catch {
    // DB unavailable during static build — return static routes only
  }

  return [...staticRoutes, ...blogRoutes, ...productRoutes]
}
