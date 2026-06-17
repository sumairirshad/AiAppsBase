import type { MetadataRoute } from 'next'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://aiforge.dev'

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
          '/product/',
          '/about',
          '/blog',
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
