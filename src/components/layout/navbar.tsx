'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Search, ShoppingCart, Menu, User, LogOut, LayoutDashboard, Zap, ArrowRight,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Icon } from '@/components/icon'
import { ThemeToggle } from '@/components/theme-toggle'
import {
  NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuList,
  NavigationMenuTrigger, navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose,
} from '@/components/ui/sheet'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { megaMenus, simpleNavLinks } from '@/lib/nav-data'

type Me = { full_name: string; email: string; role: string }

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <div className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-fuchsia-500 shadow-md transition-shadow hover:shadow-glow">
        <Zap className="size-5 text-white" />
      </div>
      <span className="font-display text-lg font-bold tracking-tight">AIAppsBase</span>
    </Link>
  )
}

function MegaMenuLink({ label, href, description, icon, badge }: {
  label: string; href: string; description?: string; icon?: string; badge?: string
}) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-3 rounded-lg p-2.5 transition-colors hover:bg-accent"
    >
      <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
        <Icon name={icon} className="size-4" />
      </span>
      <span className="min-w-0">
        <span className="flex items-center gap-2 text-sm font-medium">
          {label}
          {badge && <Badge variant="success" className="px-1.5 py-0 text-[10px]">{badge}</Badge>}
        </span>
        {description && <span className="line-clamp-1 text-xs text-muted-foreground">{description}</span>}
      </span>
    </Link>
  )
}

function DesktopNav() {
  return (
    <NavigationMenu className="hidden lg:flex">
      <NavigationMenuList>
        {megaMenus.map((menu) => (
          <NavigationMenuItem key={menu.label}>
            <NavigationMenuTrigger>{menu.label}</NavigationMenuTrigger>
            <NavigationMenuContent>
              <div className={cn('grid gap-2 p-4', menu.featured ? 'w-[640px] grid-cols-[1fr_1fr_1.1fr]' : 'w-[560px] grid-cols-3')}>
                {menu.featured && (
                  <Link
                    href={menu.featured.href}
                    className="group relative row-span-full flex flex-col justify-end overflow-hidden rounded-lg bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 p-4 text-white"
                  >
                    <div className="absolute inset-0 bg-grid bg-grid-pattern opacity-20" />
                    <Icon name={menu.featured.icon} className="relative mb-2 size-6" />
                    <span className="relative text-sm font-semibold">{menu.featured.label}</span>
                    <span className="relative mt-1 text-xs text-white/80">{menu.featured.description}</span>
                    <span className="relative mt-3 inline-flex items-center gap-1 text-xs font-medium">
                      Explore <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </Link>
                )}
                {menu.columns.map((col) => (
                  <div key={col.title} className="space-y-1">
                    <div className="px-2.5 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {col.title}
                    </div>
                    {col.items.map((item) => (
                      <MegaMenuLink key={item.label} {...item} />
                    ))}
                  </div>
                ))}
              </div>
            </NavigationMenuContent>
          </NavigationMenuItem>
        ))}
        {simpleNavLinks.map((link) => (
          <NavigationMenuItem key={link.href}>
            <Link href={link.href} className={navigationMenuTriggerStyle()}>
              {link.label}
            </Link>
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  )
}

function MobileNav({ user, onLogout }: { user: Me | null; onLogout: () => void }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="flex w-full flex-col p-0 sm:max-w-sm">
        <SheetHeader className="border-b border-border p-4 text-left">
          <SheetTitle><Logo /></SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-4">
          <Accordion type="multiple" className="w-full">
            {megaMenus.map((menu) => (
              <AccordionItem key={menu.label} value={menu.label}>
                <AccordionTrigger className="text-sm">{menu.label}</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    {menu.columns.map((col) => (
                      <div key={col.title}>
                        <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          {col.title}
                        </div>
                        <div className="grid grid-cols-2 gap-1">
                          {col.items.map((item) => (
                            <SheetClose asChild key={item.label}>
                              <Link href={item.href} className="flex items-center gap-2 rounded-md py-1.5 text-sm text-muted-foreground hover:text-foreground">
                                <Icon name={item.icon} className="size-3.5" />
                                {item.label}
                              </Link>
                            </SheetClose>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          <div className="mt-2 space-y-1">
            {simpleNavLinks.map((l) => (
              <SheetClose asChild key={l.href}>
                <Link href={l.href} className="block py-2 text-sm font-medium">{l.label}</Link>
              </SheetClose>
            ))}
          </div>
        </div>
        <div className="border-t border-border p-4">
          {user ? (
            <div className="space-y-2">
              <SheetClose asChild>
                <Button variant="outline" className="w-full" asChild>
                  <Link href={user.role === 'admin' ? '/admin' : user.role === 'seller' ? '/panel' : '/buyer'}>
                    <LayoutDashboard className="size-4" /> Dashboard
                  </Link>
                </Button>
              </SheetClose>
              <Button variant="ghost" className="w-full text-destructive" onClick={onLogout}>
                <LogOut className="size-4" /> Sign out
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <SheetClose asChild>
                <Button variant="outline" asChild><Link href="/auth/login">Sign in</Link></Button>
              </SheetClose>
              <SheetClose asChild>
                <Button variant="gradient" asChild><Link href="/auth/register">Sign up</Link></Button>
              </SheetClose>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

export function Navbar() {
  const router = useRouter()
  const [user, setUser] = React.useState<Me | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [scrolled, setScrolled] = React.useState(false)

  React.useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => setUser(d.user ?? null))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleLogout = async () => {
    await fetch('/api/auth/me', { method: 'DELETE' }).catch(() => {})
    setUser(null)
    router.push('/')
    router.refresh()
  }

  const dashboardHref = user?.role === 'admin' ? '/admin' : user?.role === 'seller' ? '/panel' : '/buyer'

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full border-b transition-colors duration-300',
        scrolled
          ? 'border-border bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60'
          : 'border-transparent bg-background/40 backdrop-blur-md'
      )}
    >
      <div className="container flex h-16 items-center gap-4">
        <Logo />

        <div className="flex-1">
          <DesktopNav />
        </div>

        {/* Search (desktop) */}
        <button
          onClick={() => router.push('/products')}
          className="hidden items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted md:flex"
        >
          <Search className="size-4" />
          <span className="hidden lg:inline">Search projects…</span>
          <kbd className="ml-2 hidden rounded border border-border bg-background px-1.5 text-[10px] font-medium lg:inline">⌘K</kbd>
        </button>

        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <Button  variant="ghost" size="icon" asChild aria-label="Cart">
            <Link href="/cart"><ShoppingCart className="size-5" /></Link>
          </Button>

          {loading ? (
            <Skeleton className="h-9 w-20 rounded-lg" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full" aria-label="Account">
                  <Avatar className="size-8">
                    <AvatarFallback>{user.full_name.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="font-medium">{user.full_name}</div>
                  <div className="text-xs font-normal text-muted-foreground">{user.email}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={dashboardHref}><LayoutDashboard /> Dashboard</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/buyer/purchases"><ShoppingCart /> Purchases</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/buyer"><User /> Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                  <LogOut /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Button variant="ghost" asChild><Link href="/auth/login">Sign in</Link></Button>
              <Button variant="gradient" asChild><Link href="/auth/register">Get started</Link></Button>
            </div>
          )}

          <MobileNav user={user} onLogout={handleLogout} />
        </div>
      </div>
    </header>
  )
}
