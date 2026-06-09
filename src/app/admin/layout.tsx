'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Package,
  Users,
  DollarSign,
  Zap,
  ShieldCheck,
} from 'lucide-react'

const NAV = [
  { label: 'Dashboard',  href: '/admin',           icon: LayoutDashboard },
  { label: 'Products',   href: '/admin/products',   icon: Package },
  { label: 'Users',      href: '/admin/users',      icon: Users },
  { label: 'Finances',   href: '/admin/finances',   icon: DollarSign },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="flex min-h-screen bg-surface-950">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/10 glass hidden md:flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-white/10">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-purple-500 rounded-lg flex items-center justify-center group-hover:shadow-lg group-hover:shadow-brand-500/25 transition-all">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">AIForge</span>
          </Link>
        </div>

        {/* Admin badge */}
        <div className="px-4 pt-4">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Admin Panel</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1 mt-2">
          {NAV.map((item) => {
            const isActive =
              item.href === '/admin'
                ? pathname === '/admin'
                : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-500/10 text-brand-400'
                    : 'text-surface-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <item.icon className={`w-4 h-4 ${isActive ? 'text-brand-400' : ''}`} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Back to site */}
        <div className="p-4 border-t border-white/10">
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-surface-500 hover:text-white hover:bg-white/5 transition-colors"
          >
            ← Back to site
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-500/5 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-purple-500/5 rounded-full blur-3xl -z-10" />
        {children}
      </main>
    </div>
  )
}
