'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'

const LINKS = [
  { href: '/', label: 'Posts' },
  { href: '/posts/new', label: 'New post' },
  { href: '/templates', label: 'Caption templates' },
  { href: '/engagement', label: 'Engagement' },
  { href: '/settings/linkedin', label: 'LinkedIn connection' },
]

export function Nav() {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  if (!user) return null

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-3">
        <div className="flex flex-wrap items-center gap-1">
          <span className="mr-3 font-semibold text-slate-900">Tisoro LinkedIn</span>
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                pathname === link.href ? 'bg-sky-100 text-sky-900' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-3 text-sm text-slate-600">
          <span>{user.fullName}</span>
          <button
            onClick={() => {
              logout()
              router.replace('/login')
            }}
            className="rounded-md border border-slate-300 px-3 py-1.5 font-medium hover:bg-slate-100"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  )
}
