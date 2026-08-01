import type { MetadataRoute } from 'next'
import { query } from '@/lib/db'
import { posts } from '@/lib/blog-data'
import { productPath, APP_URL } from '@/lib/seo'

const route = (
  path: string,
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'],
  priority: number
): MetadataRoute.Sitemap[number] => ({
  url: `${APP_URL}${path}`,
  lastModified: new Date(),
  changeFrequency,
  priority,
})

const staticRoutes: MetadataRoute.Sitemap = [
  route('/', 'daily', 1),
  route('/products', 'hourly', 0.9),
  route('/templates', 'daily', 0.9),
  route('/apps', 'daily', 0.9),
  route('/components', 'daily', 0.9),
  route('/top-sellers', 'daily', 0.7),
  route('/about', 'monthly', 0.6),
  route('/pricing', 'monthly', 0.6),
  route('/blog', 'weekly', 0.7),
  route('/docs', 'weekly', 0.5),
  route('/api-docs', 'monthly', 0.4),
  route('/support', 'monthly', 0.5),
  route('/contact', 'monthly', 0.4),
  route('/community', 'weekly', 0.4),
  route('/careers', 'weekly', 0.4),
  route('/press', 'monthly', 0.3),
  route('/partners', 'monthly', 0.4),
  route('/affiliates', 'monthly', 0.4),
  route('/enterprise', 'monthly', 0.5),
  route('/integrations', 'monthly', 0.5),
  route('/roadmap', 'weekly', 0.4),
  route('/changelog', 'weekly', 0.4),
  route('/trust', 'monthly', 0.5),
  route('/security', 'monthly', 0.5),
  route('/status', 'daily', 0.3),
  route('/terms', 'yearly', 0.3),
  route('/privacy', 'yearly', 0.3),
  route('/cookies', 'yearly', 0.3),
  route('/refund', 'yearly', 0.3),
  route('/license', 'yearly', 0.3),
  route('/dmca', 'yearly', 0.3),
  route('/gdpr', 'yearly', 0.3),
  route('/accessibility', 'yearly', 0.3),
]

const blogRoutes: MetadataRoute.Sitemap = posts.map((p) => ({
  url: `${APP_URL}/blog/${p.slug}`,
  lastModified: new Date(p.date),
  changeFrequency: 'monthly',
  priority: 0.6,
}))

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let productRoutes: MetadataRoute.Sitemap = []

  try {
    const result = await query(
      `SELECT id, title, updated_at FROM products WHERE status = 'approved' ORDER BY updated_at DESC`
    )
    productRoutes = (result.rows || []).map((p) => ({
      url: `${APP_URL}${productPath({ id: p.id, title: p.title })}`,
      lastModified: new Date(p.updated_at),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))
  } catch {
    // DB unavailable during static build — return static routes only
  }

  return [...staticRoutes, ...blogRoutes, ...productRoutes]
}
