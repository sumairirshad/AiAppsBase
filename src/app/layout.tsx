import type { Metadata, Viewport } from 'next'
import { Inter, Sora, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { Toaster as HotToaster } from 'react-hot-toast'
import { ThemeProvider } from '@/components/theme-provider'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/sonner'
import { cn } from '@/lib/utils'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://aiappsbase.dev'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#050914' },
  ],
}

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: 'AIAppsBase — Marketplace for AI-Built Apps & Templates',
    template: '%s | AIAppsBase',
  },
  description:
    'Discover and purchase websites, web apps, UI components, and mobile apps built with AI tools like ChatGPT, Claude, v0, Bolt, Cursor, and Lovable.',
  keywords: [
    'AI apps', 'AI templates', 'AI marketplace', 'AI-built websites',
    'ChatGPT apps', 'Claude apps', 'v0 templates', 'Bolt apps', 'Cursor',
    'buy website template', 'sell AI app', 'no-code marketplace',
  ],
  authors: [{ name: 'AIAppsBase' }],
  creator: 'AIAppsBase',
  publisher: 'AIAppsBase',
  openGraph: {
    type: 'website',
    siteName: 'AIAppsBase',
    locale: 'en_US',
    url: APP_URL,
    title: 'AIAppsBase — Marketplace for AI-Built Apps & Templates',
    description:
      'Browse thousands of websites, apps, and UI components built with AI tools. Find your next project starting point.',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@aiappsbase',
    title: 'AIAppsBase — Marketplace for AI-Built Apps & Templates',
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
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          inter.variable,
          sora.variable,
          jetbrainsMono.variable,
          'min-h-screen bg-background font-sans text-foreground antialiased'
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider delayDuration={200}>
            <Navbar />
            <main className="min-h-screen">{children}</main>
            <Footer />
          </TooltipProvider>
          <Toaster />
          <HotToaster position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  )
}
