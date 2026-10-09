import type { Metadata, Viewport } from 'next'
import { Inter, Sora, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { SiteNavbar, SiteFooter } from '@/components/layout/site-chrome'
import { Toaster as HotToaster } from 'react-hot-toast'
import { ThemeProvider } from '@/components/theme-provider'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/sonner'
import { cn } from '@/lib/utils'
import { JsonLd } from '@/components/seo/json-ld'
import { APP_URL, organizationSchema, websiteSchema } from '@/lib/seo'
import { getCurrentUser } from '@/lib/dashboard'

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
    'AIAppsBase is an AI apps marketplace to discover the best AI apps — artificial intelligence applications, websites, web apps, and mobile apps — built with tools like ChatGPT, Claude, v0, Bolt, Cursor, and Lovable.',
  keywords: [
    'AI apps', 'artificial intelligence app', 'best AI apps', 'top AI apps', 'apps AI',
    'AI apps marketplace', 'AI-built websites', 'AI templates',
    'ChatGPT apps', 'Claude apps', 'buy AI app', 'sell AI app',
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
      'Discover the best AI apps — artificial intelligence applications, websites, and UI components built with AI tools. Find your next project starting point.',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@aiappsbase',
    title: 'AIAppsBase — Marketplace for AI-Built Apps & Templates',
    description: 'Discover the best AI apps and artificial intelligence applications, built with AI tools.',
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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Resolved server-side so the header never flashes a loading placeholder
  // before showing "Sign in" or the account menu.
  const user = await getCurrentUser()

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
        <JsonLd data={[organizationSchema(), websiteSchema()]} />
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider delayDuration={200}>
            <SiteNavbar initialUser={user ? { full_name: user.full_name, email: user.email, role: user.role } : null} />
            <main className="min-h-screen">{children}</main>
            <SiteFooter />
          </TooltipProvider>
          <Toaster />
          <HotToaster position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  )
}
