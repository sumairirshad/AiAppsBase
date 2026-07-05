'use client'

import { usePathname } from 'next/navigation'

import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'

/**
 * Marketing chrome (navbar + footer) is hidden on app surfaces that provide
 * their own shell — dashboards and the admin panel.
 */
const HIDDEN_PREFIXES = ['/panel', '/buyer', '/admin']

function useHideChrome() {
  const pathname = usePathname()
  return HIDDEN_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

export function SiteNavbar() {
  return useHideChrome() ? null : <Navbar />
}

export function SiteFooter() {
  return useHideChrome() ? null : <Footer />
}
