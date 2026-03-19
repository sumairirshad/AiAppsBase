import type { Metadata } from 'next'
import './globals.css'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: 'AIForge — Marketplace for AI-Built Apps',
  description: 'Discover and purchase websites, web apps, and mobile apps built with AI tools like ChatGPT, Claude, v0, Bolt, and more.',
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
