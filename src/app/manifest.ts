import type { MetadataRoute } from 'next'
import { SITE_NAME } from '@/lib/seo'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} — Marketplace for AI-Built Apps & Templates`,
    short_name: SITE_NAME,
    description:
      'Discover and purchase websites, web apps, UI components, and mobile apps built with AI tools like ChatGPT, Claude, v0, Bolt, Cursor, and Lovable.',
    start_url: '/',
    display: 'standalone',
    background_color: '#050914',
    theme_color: '#050914',
    icons: [
      { src: '/icon', sizes: '32x32', type: 'image/png' },
    ],
  }
}
