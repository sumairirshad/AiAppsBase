'use client'

import { usePathname } from 'next/navigation'

import { Navbar, type Me } from '@/components/layout/navbar'
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

export function SiteNavbar({ initialUser }: { initialUser: Me | null }) {
  return useHideChrome() ? null : <Navbar initialUser={initialUser} />
}

export function SiteFooter() {
  return useHideChrome() ? null : <Footer />
}
