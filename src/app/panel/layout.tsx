'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BarChart2,
  Package,
  Settings,
  ChevronDown,
  ChevronRight,
  PlusCircle,
  LayoutDashboard,
  Zap,
  Github,
} from 'lucide-react'

const MENU_ITEMS = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    href: '/panel',
  },
  {
    label: 'Sell',
    icon: Package,
    href: '/panel/seller',
    children: [
      { label: 'My Products', href: '/panel/seller/products' },
      { label: 'Add Product', href: '/panel/seller/add-product', icon: PlusCircle },
      { label: 'GitHub Repos', href: '/panel/seller/github', icon: Github },
    ]
  },
]

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [openMenus, setOpenMenus] = useState<string[]>(['Sell'])

  const toggleMenu = (label: string) => {
    setOpenMenus(prev => 
      prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
    )
  }

  return (
    <div className="flex min-h-screen bg-surface-950">
      <aside className="w-64 border-r border-white/10 glass hidden md:flex flex-col">
        <div className="p-6 border-b border-white/10">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-purple-500 rounded-lg flex items-center justify-center group-hover:shadow-lg group-hover:shadow-brand-500/25 transition-all">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">AIForge</span>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {MENU_ITEMS.map((item) => {
            const hasChildren = item.children && item.children.length > 0
            const isOpen = openMenus.includes(item.label)
            const isActive = pathname === item.href || (hasChildren && pathname.startsWith(item.href))

            return (
              <div key={item.label} className="space-y-1">
                <button
                  onClick={() => hasChildren ? toggleMenu(item.label) : null}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive && !hasChildren
                      ? 'bg-brand-500/10 text-brand-400' 
                      : 'text-surface-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Link href={hasChildren ? '#' : item.href} className="flex items-center gap-3 flex-1">
                    <item.icon className={`w-4 h-4 ${isActive ? 'text-brand-400' : ''}`} />
                    {item.label}
                  </Link>
                  {hasChildren && (
                    isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
                  )}
                </button>

                {hasChildren && isOpen && (
                  <div className="pl-9 space-y-1 mt-1">
                    {item.children?.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={`block px-3 py-2 rounded-md text-sm transition-colors ${
                          pathname === child.href
                            ? 'text-brand-400 font-medium'
                            : 'text-surface-500 hover:text-white'
                        }`}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="bg-white/5 rounded-xl p-4">
            <p className="text-xs text-surface-500 mb-1">Logged in as</p>
            <p className="text-sm font-medium text-white truncate">User Account</p>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-8 relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-500/5 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-purple-500/5 rounded-full blur-3xl -z-10" />
        
        {children}
      </main>
    </div>
  )
}
