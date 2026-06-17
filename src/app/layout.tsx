import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { Toaster } from 'react-hot-toast'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://aiforge.dev'

export const viewport: Viewport = {
  themeColor: '#0ea5e9',
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: 'AIForge — Marketplace for AI-Built Apps & Templates',
    template: '%s | AIForge',
  },
  description:
    'Discover and purchase websites, web apps, UI components, and mobile apps built with AI tools like ChatGPT, Claude, v0, Bolt, Cursor, and Lovable.',
  keywords: [
    'AI apps', 'AI templates', 'AI marketplace', 'AI-built websites',
    'ChatGPT apps', 'Claude apps', 'v0 templates', 'Bolt apps', 'Cursor',
    'buy website template', 'sell AI app', 'no-code marketplace',
  ],
  authors: [{ name: 'AIForge' }],
  creator: 'AIForge',
  publisher: 'AIForge',
  openGraph: {
    type: 'website',
    siteName: 'AIForge',
    locale: 'en_US',
    url: APP_URL,
    title: 'AIForge — Marketplace for AI-Built Apps & Templates',
    description:
      'Browse thousands of websites, apps, and UI components built with AI tools. Find your next project starting point.',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@aiforge',
    title: 'AIForge — Marketplace for AI-Built Apps & Templates',
    description: 'Browse thousands of AI-built websites, apps, and UI components.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: APP_URL,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased bg-surface-950 text-white min-h-screen">
        <Navbar />
        <main className="min-h-screen">{children}</main>
        <Footer />
        <Toaster position="top-right" />
      </body>
    </html>
  )
}
