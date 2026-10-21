import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/lib/auth-context'
import { Nav } from '@/components/nav'

export const metadata: Metadata = {
  title: 'Tisoro LinkedIn Content Scheduler',
  description: 'Compose, schedule, and publish Tisoro Global LinkedIn content.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <AuthProvider>
          <Nav />
          <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
        </AuthProvider>
      </body>
    </html>
  )
}
