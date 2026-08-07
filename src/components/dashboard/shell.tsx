'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, BarChart3, Package, PlusCircle, Github, ShoppingBag, Users,
  Star, Wallet, Settings, Heart, Download, Receipt, LogOut, Zap, ArrowLeft, Menu, Store,
  ShieldCheck, Bell, FileText, ClipboardList, MessageSquare, DollarSign, Landmark,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ThemeToggle } from '@/components/theme-toggle'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'

type Item = { label: string; href: string; icon: any; badge?: string }

const SELLER_NAV: Item[] = [
  { label: 'Dashboard', href: '/panel', icon: LayoutDashboard },
  { label: 'Analytics', href: '/panel/analytics', icon: BarChart3 },
  { label: 'My Products', href: '/panel/seller/products', icon: Package },
  { label: 'Add Product', href: '/panel/seller/add-product', icon: PlusCircle },
  { label: 'GitHub Repos', href: '/panel/seller/github', icon: Github },
  { label: 'Orders', href: '/panel/orders', icon: ShoppingBag },
  { label: 'Customers', href: '/panel/customers', icon: Users },
  { label: 'Reviews', href: '/panel/reviews', icon: Star },
  { label: 'Wallet', href: '/panel/wallet', icon: Wallet },
  { label: 'Settings', href: '/panel/settings', icon: Settings },
]

const BUYER_NAV: Item[] = [
  { label: 'Dashboard', href: '/buyer', icon: LayoutDashboard },
  { label: 'Purchases', href: '/buyer/purchases', icon: ShoppingBag },
  { label: 'Downloads', href: '/buyer/downloads', icon: Download },
  { label: 'Wishlist', href: '/buyer/wishlist', icon: Heart },
  { label: 'Orders', href: '/buyer/orders', icon: Receipt },
  { label: 'Reviews', href: '/buyer/reviews', icon: Star },
  { label: 'Settings', href: '/buyer/settings', icon: Settings },
]

const ADMIN_NAV: Item[] = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Sellers', href: '/admin/sellers', icon: Store },
  { label: 'Products', href: '/admin/products', icon: Package },
  { label: 'Orders', href: '/admin/orders', icon: ShoppingBag },
  { label: 'Reviews', href: '/admin/reviews', icon: MessageSquare },
  { label: 'Finances', href: '/admin/finances', icon: DollarSign },
  { label: 'Settlements', href: '/admin/settlements', icon: Landmark },
  { label: 'Reports', href: '/admin/reports', icon: FileText },
  { label: 'Notifications', href: '/admin/notifications', icon: Bell },
  { label: 'Audit Logs', href: '/admin/audit-logs', icon: ClipboardList },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
]

function NavList({ items, onNavigate }: { items: Item[]; onNavigate?: () => void }) {
  const pathname = usePathname()
  return (
    <nav className="space-y-1">
      {items.map((item) => {
        const isBase = item.href === '/panel' || item.href === '/buyer' || item.href === '/admin'
        const active = item.href === pathname || (!isBase && pathname.startsWith(item.href))
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            )}
          >
            <item.icon className="size-4" />
            {item.label}
            {item.badge && <span className="ml-auto rounded-full bg-primary/15 px-1.5 text-[10px] font-semibold text-primary">{item.badge}</span>}
          </Link>
        )
      })}
    </nav>
  )
}

type PortalRole = 'buyer' | 'seller' | 'admin'

function SidebarInner({ role, onNavigate }: { role: PortalRole; onNavigate?: () => void }) {
  const router = useRouter()
  const items = role === 'admin' ? ADMIN_NAV : role === 'seller' ? SELLER_NAV : BUYER_NAV

  const logout = async () => {
    await fetch('/api/auth/me', { method: 'DELETE' }).catch(() => {})
    router.push('/')
    router.refresh()
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center border-b border-border px-5">
        <Link href="/" className="flex items-center gap-2" onClick={onNavigate}>
          <div className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-fuchsia-500 shadow-md">
            <Zap className="size-5 text-white" />
          </div>
          <span className="font-display text-lg font-bold">AIAppsBase</span>
        </Link>
      </div>

      <div className="px-4 pt-4">
        <div className={cn(
          'flex items-center gap-2 rounded-lg border px-3 py-2',
          role === 'admin' ? 'border-warning/20 bg-warning/10' : role === 'seller' ? 'border-primary/20 bg-primary/10' : 'border-fuchsia-500/20 bg-fuchsia-500/10'
        )}>
          {role === 'admin' ? <ShieldCheck className="size-4 text-warning" /> : role === 'seller' ? <Store className="size-4 text-primary" /> : <ShoppingBag className="size-4 text-fuchsia-500" />}
          <span className={cn(
            'text-xs font-semibold uppercase tracking-wider',
            role === 'admin' ? 'text-warning' : role === 'seller' ? 'text-primary' : 'text-fuchsia-500'
          )}>
            {role === 'admin' ? 'Admin Panel' : role === 'seller' ? 'Seller Account' : 'Buyer Account'}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <NavList items={items} onNavigate={onNavigate} />
      </div>

      <div className="space-y-1 border-t border-border p-4">
        <Link href="/products" onClick={onNavigate} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
          <ArrowLeft className="size-4" /> Browse marketplace
        </Link>
        <button onClick={logout} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10">
          <LogOut className="size-4" /> Sign out
        </button>
      </div>
    </div>
  )
}

export function DashboardShell({ role, children }: { role: PortalRole; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/20 lg:flex">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-border bg-background lg:block">
        <SidebarInner role={role} />
      </aside>

      <div className="flex min-h-screen flex-1 flex-col lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-xl lg:px-8">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu"><Menu className="size-5" /></Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <SidebarInner role={role} />
            </SheetContent>
          </Sheet>

          <div className="hidden text-sm text-muted-foreground lg:block">
            {role === 'admin' ? 'Admin workspace' : role === 'seller' ? 'Seller workspace' : 'Your account'}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <Avatar className="size-8">
              <AvatarFallback>{role === 'admin' ? 'A' : role === 'seller' ? 'S' : 'B'}</AvatarFallback>
            </Avatar>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
