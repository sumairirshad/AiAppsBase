'use client'

import * as React from 'react'
import {
  Sparkles, Github, Star, Download, Heart, ArrowRight, Check, Zap,
  ShieldCheck, TrendingUp, Palette, Bell,
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader,
  DialogTitle, DialogTrigger, DialogClose,
} from '@/components/ui/dialog'
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger,
} from '@/components/ui/sheet'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { ThemeToggle } from '@/components/theme-toggle'

function Section({ title, description, children }: {
  title: string; description?: string; children: React.ReactNode
}) {
  return (
    <section className="space-y-5">
      <div className="space-y-1">
        <h2 className="font-display text-2xl font-semibold tracking-tight">{title}</h2>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  )
}

const swatches = [
  { name: 'Background', className: 'bg-background border' },
  { name: 'Card', className: 'bg-card border' },
  { name: 'Primary', className: 'bg-primary' },
  { name: 'Secondary', className: 'bg-secondary' },
  { name: 'Muted', className: 'bg-muted' },
  { name: 'Accent', className: 'bg-accent' },
  { name: 'Destructive', className: 'bg-destructive' },
  { name: 'Success', className: 'bg-success' },
  { name: 'Warning', className: 'bg-warning' },
]

export default function StyleGuidePage() {
  return (
    <div className="relative overflow-hidden">
      {/* Aurora backdrop */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 left-1/4 h-96 w-96 animate-aurora-drift rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute top-20 right-1/4 h-96 w-96 animate-aurora-drift rounded-full bg-fuchsia-500/15 blur-3xl [animation-delay:3s]" />
        <div className="absolute inset-0 bg-grid bg-grid-pattern mask-fade-b opacity-40" />
      </div>

      <div className="container max-w-6xl space-y-16 py-16">
        {/* Header */}
        <header className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <Badge variant="brand" className="px-3 py-1">
              <Sparkles className="size-3" /> Design System · v1
            </Badge>
            <ThemeToggle />
          </div>
          <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
            The <span className="text-gradient-brand">AIAppsBase</span> UI Kit
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            A premium, theme-aware component library built on shadcn/ui and Radix.
            Every primitive here powers the marketplace — buttons, cards, dialogs,
            forms, and feedback, in both light and dark.
          </p>
        </header>

        <Separator />

        {/* Colors */}
        <Section title="Color tokens" description="Semantic, theme-driven. Toggle the theme to watch them adapt.">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {swatches.map((s) => (
              <div key={s.name} className="space-y-2">
                <div className={`h-16 w-full rounded-lg border-border ${s.className}`} />
                <p className="text-xs font-medium text-muted-foreground">{s.name}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* Buttons */}
        <Section title="Buttons" description="Six variants, five sizes, loading state, icon support.">
          <div className="flex flex-wrap gap-3">
            <Button variant="gradient"><Zap /> Get started</Button>
            <Button>Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline"><Github /> Connect GitHub</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Delete</Button>
            <Button variant="link">Learn more</Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
            <Button size="xl" variant="gradient">Extra large <ArrowRight /></Button>
            <Button size="icon" variant="outline"><Heart /></Button>
            <Button loading>Processing</Button>
          </div>
        </Section>

        {/* Badges */}
        <Section title="Badges" description="Status, category, and metric pills.">
          <div className="flex flex-wrap gap-2">
            <Badge>Default</Badge>
            <Badge variant="brand"><Sparkles /> Featured</Badge>
            <Badge variant="secondary">Next.js</Badge>
            <Badge variant="success"><Check /> Verified seller</Badge>
            <Badge variant="warning"><TrendingUp /> Trending</Badge>
            <Badge variant="destructive">Sold out</Badge>
            <Badge variant="outline"><Star /> 4.9</Badge>
            <Badge variant="muted">MIT License</Badge>
          </div>
        </Section>

        {/* Cards */}
        <Section title="Cards" description="The marketplace's core surface, with an interactive hover state.">
          <div className="grid gap-6 md:grid-cols-3">
            <Card interactive>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/12 text-primary">
                    <Zap className="size-5" />
                  </div>
                  <Badge variant="success"><Check /> Live</Badge>
                </div>
                <CardTitle className="pt-3">Nexus SaaS Starter</CardTitle>
                <CardDescription>
                  Full-stack Next.js 14 boilerplate with auth, billing, and a dashboard.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1"><Star className="size-4" /> 2.4k</span>
                <span className="inline-flex items-center gap-1"><Download className="size-4" /> 890</span>
              </CardContent>
              <CardFooter className="justify-between">
                <span className="font-display text-lg font-semibold">$79</span>
                <Button size="sm" variant="gradient">Buy now <ArrowRight /></Button>
              </CardFooter>
            </Card>

            <Card interactive>
              <CardHeader>
                <div className="flex size-10 items-center justify-center rounded-lg bg-fuchsia-500/12 text-fuchsia-500">
                  <Palette className="size-5" />
                </div>
                <CardTitle className="pt-3">Aurora UI Kit</CardTitle>
                <CardDescription>120+ crafted React components with dark mode built in.</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center gap-2">
                <Badge variant="secondary">React</Badge>
                <Badge variant="secondary">Tailwind</Badge>
                <Badge variant="muted">Free</Badge>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">View details</Button>
              </CardFooter>
            </Card>

            <Card interactive>
              <CardHeader>
                <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-500/12 text-emerald-500">
                  <ShieldCheck className="size-5" />
                </div>
                <CardTitle className="pt-3">Verified & secure</CardTitle>
                <CardDescription>Every listing is scanned and reviewed before it goes live.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src="https://avatars.githubusercontent.com/u/9919?v=4" alt="seller" />
                    <AvatarFallback>AB</AvatarFallback>
                  </Avatar>
                  <div className="text-sm">
                    <p className="font-medium">Alex Rivera</p>
                    <p className="text-muted-foreground">Top seller · 4.9 ★</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </Section>

        {/* Forms */}
        <Section title="Form controls" description="Accessible inputs with labels, hints, and focus rings.">
          <Card>
            <CardContent className="grid gap-5 pt-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Work email</Label>
                <Input id="email" type="email" placeholder="you@company.com" />
                <p className="text-xs text-muted-foreground">We&apos;ll never share your email.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="repo">Repository name</Label>
                <Input id="repo" placeholder="acme/nexus-starter" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="desc">Description</Label>
                <Textarea id="desc" rows={3} placeholder="Tell buyers what makes your project great…" />
              </div>
            </CardContent>
            <CardFooter className="justify-end gap-3">
              <Button variant="ghost">Cancel</Button>
              <Button variant="gradient">Publish listing</Button>
            </CardFooter>
          </Card>
        </Section>

        {/* Tabs */}
        <Section title="Tabs" description="For switching contexts inside a page.">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList>
              <TabsTrigger value="overview"><Sparkles /> Overview</TabsTrigger>
              <TabsTrigger value="reviews"><Star /> Reviews</TabsTrigger>
              <TabsTrigger value="changelog"><TrendingUp /> Changelog</TabsTrigger>
            </TabsList>
            <TabsContent value="overview">
              <Card><CardContent className="pt-6 text-sm text-muted-foreground">
                A production-grade SaaS starter with everything wired up out of the box.
              </CardContent></Card>
            </TabsContent>
            <TabsContent value="reviews">
              <Card><CardContent className="pt-6 text-sm text-muted-foreground">
                “Saved me three weeks of setup.” — 128 verified reviews.
              </CardContent></Card>
            </TabsContent>
            <TabsContent value="changelog">
              <Card><CardContent className="pt-6 text-sm text-muted-foreground">
                v2.3.0 — Added Stripe usage-based billing and a new analytics page.
              </CardContent></Card>
            </TabsContent>
          </Tabs>
        </Section>

        {/* Overlays + feedback */}
        <Section title="Overlays & feedback" description="Dialogs, sheets, menus, tooltips, and toasts.">
          <div className="flex flex-wrap gap-3">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">Open dialog</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirm purchase</DialogTitle>
                  <DialogDescription>
                    You&apos;re about to buy <strong>Nexus SaaS Starter</strong> for $79.
                    You&apos;ll get instant access to the source and future updates.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
                  <Button variant="gradient" onClick={() => toast.success('Purchase complete!')}>
                    Pay $79
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline">Open sheet</Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                  <SheetDescription>Refine the marketplace to find exactly what you need.</SheetDescription>
                </SheetHeader>
                <div className="space-y-3 p-6">
                  <Badge variant="secondary">Next.js</Badge>{' '}
                  <Badge variant="secondary">SaaS</Badge>{' '}
                  <Badge variant="secondary">Free</Badge>
                </div>
              </SheetContent>
            </Sheet>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">Dropdown</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem><TrendingUp /> Trending</DropdownMenuItem>
                <DropdownMenuItem><Star /> Top rated</DropdownMenuItem>
                <DropdownMenuItem><Download /> Most downloaded</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon"><Bell /></Button>
              </TooltipTrigger>
              <TooltipContent>You have 3 new notifications</TooltipContent>
            </Tooltip>

            <Button onClick={() => toast.success('Saved to your wishlist')}>Toast: success</Button>
            <Button variant="secondary" onClick={() => toast.error('Something went wrong')}>Toast: error</Button>
            <Button variant="secondary" onClick={() => toast('Synced 12 repositories', { description: 'Just now' })}>
              Toast: info
            </Button>
          </div>
        </Section>

        {/* Skeletons */}
        <Section title="Loading skeletons" description="Shimmering placeholders for async content.">
          <div className="grid gap-6 md:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Card key={i}>
                <CardHeader className="space-y-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-5/6" />
                </CardHeader>
                <CardFooter className="justify-between">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-9 w-24 rounded-lg" />
                </CardFooter>
              </Card>
            ))}
          </div>
        </Section>

        <Separator />
        <p className="pb-8 text-center text-sm text-muted-foreground">
          Phase 1 foundation — shadcn/ui + Radix, theme-aware, ready for the marketplace build.
        </p>
      </div>
    </div>
  )
}
