import type { MetadataRoute } from 'next'
import { APP_URL } from '@/lib/seo'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/products',
          '/templates',
          '/apps',
          '/components',
          '/ai-projects',
          '/ecommerce',
          '/mobile-apps',
          '/browser-extensions',
          '/developer-tools',
          '/best-ai-coding-tools',
          '/product/',
          '/about',
          '/blog',
          '/blog/',
          '/support',
          '/terms',
          '/privacy',
          '/cookies',
        ],
        disallow: [
          '/api/',
          '/admin/',
          '/buyer/',
          '/seller/',
          '/panel/',
          '/auth/',
          '/checkout/',
        ],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
  }
}
