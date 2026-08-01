import Link from 'next/link'
import {
  ArrowRight, Star, Github, ShieldCheck, Wallet, LineChart, BadgeCheck, Globe,
  Sparkles, Check, GitBranch, GitCommitHorizontal, Lock, RefreshCw, ArrowUpRight,
  PencilRuler, Rocket, CircleDollarSign, Package, Users, Layers,
} from 'lucide-react'

import { cn, formatNumber } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { ProductCard } from '@/components/marketplace/product-card'
import { HeroSearch } from '@/components/landing/hero-search'
import { NewsletterForm } from '@/components/landing/newsletter-form'
import { FaqSection } from '@/components/landing/faq-section'
import { CATEGORIES, TECHS, LANGUAGES, gradientFor } from '@/lib/marketplace-config'
import { trustedBy, features, workflow, plans, faqs } from '@/lib/landing-data'
import { getFeaturedProducts, getTopSellers, getPlatformStats, type PlatformStats } from '@/lib/products'
import { faqJsonLd } from '@/lib/seo'
import type { Repo, Seller } from '@/lib/marketplace-config'

export const revalidate = 300

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Github, ShieldCheck, Wallet, LineChart, BadgeCheck, Globe,
  PencilRuler, Rocket, CircleDollarSign,
}
const Icon = ({ name, className }: { name: string; className?: string }) => {
  const C = iconMap[name] ?? Sparkles
  return <C className={className} />
}

function SectionHeading({ eyebrow, title, description, center = true }: {
  eyebrow: string; title: React.ReactNode; description?: string; center?: boolean
}) {
  return (
    <div className={cn('max-w-2xl space-y-4', center && 'mx-auto text-center')}>
      <Badge variant="brand" className="px-3 py-1"><Sparkles className="size-3" /> {eyebrow}</Badge>
      <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
      {description && <p className="text-lg text-muted-foreground">{description}</p>}
    </div>
  )
}

/* ------------------------------- HERO ----------------------------- */
function Hero({ stats, sellers }: { stats: PlatformStats; sellers: Seller[] }) {
  return (
    <section className="relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[-10%] h-[520px] w-[820px] -translate-x-1/2 animate-aurora-drift rounded-full bg-indigo-500/25 blur-[120px]" />
        <div className="absolute right-[12%] top-[8%] h-80 w-80 animate-aurora-drift rounded-full bg-fuchsia-500/20 blur-[100px] [animation-delay:4s]" />
        <div className="absolute inset-0 bg-grid bg-grid-pattern opacity-[0.35] mask-fade-b" />
      </div>

      <div className="container flex flex-col items-center gap-8 py-20 text-center sm:py-28">
        <Link href="/products" className="group inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-1.5 text-sm backdrop-blur-xl transition-colors hover:border-primary/40">
          <Badge variant="brand" className="px-2 py-0">New</Badge>
          <span className="text-muted-foreground">GitHub-native selling is here</span>
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>

        <h1 className="max-w-4xl font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl md:text-7xl">
          The marketplace for<br />
          <span className="text-gradient-brand">AI-built projects</span> &amp; repos
        </h1>

        <p className="max-w-2xl text-lg text-muted-foreground sm:text-xl">
          Buy and sell production-ready websites, SaaS boilerplates, UI kits, and mobile apps —
          synced straight from GitHub, delivered instantly, protected end to end.
        </p>

        <HeroSearch />

        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <Button size="xl" variant="gradient" asChild><Link href="/products">Explore marketplace <ArrowRight className="size-4" /></Link></Button>
          <Button size="xl" variant="outline" asChild><Link href="/auth/register"><Github className="size-4" /> Start selling</Link></Button>
        </div>

        {sellers.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-3 pt-2 text-sm text-muted-foreground">
            <div className="flex items-center -space-x-2">
              {sellers.map((s) => (
                <Avatar key={s.id} className="size-8 border-2 border-background"><AvatarFallback>{s.name.charAt(0)}</AvatarFallback></Avatar>
              ))}
            </div>
            <span>Join <span className="font-medium text-foreground">{stats.sellers.toLocaleString()}</span> creators shipping on AIAppsBase</span>
          </div>
        )}
      </div>
    </section>
  )
}

/* ---------------------------- TRUSTED BY --------------------------- */
function TrustedBy() {
  const row = [...trustedBy, ...trustedBy]
  return (
    <section className="border-y border-border/60 bg-muted/20 py-10">
      <div className="container">
        <p className="text-center text-xs font-medium uppercase tracking-widest text-muted-foreground">Trusted by developers building at</p>
      </div>
      <div className="relative mt-6 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
        <div className="flex w-max animate-marquee items-center gap-14">
          {row.map((name, i) => <span key={i} className="whitespace-nowrap font-display text-xl font-semibold text-muted-foreground/70">{name}</span>)}
        </div>
      </div>
    </section>
  )
}

/* ------------------------------ STATS ----------------------------- */
function Stats({ stats }: { stats: PlatformStats }) {
  const items = [
    { label: 'Projects listed', value: stats.products.toLocaleString(), icon: Package },
    { label: 'Active sellers', value: stats.sellers.toLocaleString(), icon: Users },
    { label: 'Completed sales', value: stats.sales.toLocaleString(), icon: BadgeCheck },
    { label: 'Paid to creators', value: `$${formatNumber(stats.paidOut)}`, icon: Wallet },
  ]
  return (
    <section className="container py-16">
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border lg:grid-cols-4">
        {items.map((s) => (
          <div key={s.label} className="bg-card p-8 text-center">
            <div className="mx-auto mb-4 grid size-11 place-items-center rounded-xl bg-primary/10 text-primary"><s.icon className="size-5" /></div>
            <div className="font-display text-3xl font-bold sm:text-4xl">{s.value}</div>
            <div className="mt-1 text-sm font-medium">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ---------------------------- CATEGORIES -------------------------- */
function Categories() {
  return (
    <section className="container py-16">
      <div className="mb-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <SectionHeading center={false} eyebrow="Browse by category" title="Find exactly what you need"
          description="From full SaaS platforms to a single Chrome extension — curated categories." />
        <Button variant="ghost" asChild className="shrink-0"><Link href="/products">View all <ArrowRight className="size-4" /></Link></Button>
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {CATEGORIES.map((c) => (
          <Link key={c.slug} href={`/products?category=${c.slug}`}>
            <Card interactive className="group h-full p-5">
              <div className={cn('mb-4 grid size-11 place-items-center rounded-xl bg-gradient-to-br text-white shadow-md', gradientFor(c.slug))}>
                <Layers className="size-5" />
              </div>
              <h3 className="font-semibold group-hover:text-primary">{c.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">Explore projects</p>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  )
}

/* ----------------------------- FEATURES --------------------------- */
function Features() {
  return (
    <section className="container py-20">
      <SectionHeading eyebrow="Why AIAppsBase" title={<>Everything you need to <span className="text-gradient-brand">sell code</span></>}
        description="A marketplace built by developers, for developers — with the polish of a product you'd pay for." />
      <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <Card key={f.title} interactive className="p-6">
            <div className="mb-4 grid size-11 place-items-center rounded-xl bg-primary/10 text-primary"><Icon name={f.icon} className="size-5" /></div>
            <h3 className="text-lg font-semibold">{f.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.description}</p>
          </Card>
        ))}
      </div>
    </section>
  )
}

/* ------------------------ GITHUB INTEGRATION ---------------------- */
function GithubIntegration() {
  return (
    <section className="container py-20">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <div className="space-y-6">
          <SectionHeading center={false} eyebrow="GitHub integration" title="Your repos, sync-ready in one click"
            description="Connect once. We pull stars, forks, languages, releases, and your README — and keep them current with every push." />
          <ul className="space-y-3">
            {['Import public or private repositories instantly', 'Auto-detect framework, license, and tech stack',
              'Buyers receive a private invite or signed archive on purchase', 'Push a new release and your listing updates itself'].map((t) => (
              <li key={t} className="flex items-start gap-3 text-sm">
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-success/15 text-success"><Check className="size-3.5" /></span>
                <span className="text-muted-foreground">{t}</span>
              </li>
            ))}
          </ul>
          <Button variant="gradient" asChild><Link href="/auth/register"><Github className="size-4" /> Connect your GitHub</Link></Button>
        </div>

        <Card className="overflow-hidden shadow-2xl">
          <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-4 py-3">
            <div className="flex gap-1.5"><span className="size-3 rounded-full bg-red-400/70" /><span className="size-3 rounded-full bg-amber-400/70" /><span className="size-3 rounded-full bg-emerald-400/70" /></div>
            <span className="ml-2 text-xs text-muted-foreground">github-sync</span>
          </div>
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2"><Github className="size-5" /><span className="font-mono text-sm">your-org/your-repo</span></div>
              <Badge variant="success"><RefreshCw className="size-3" /> Synced</Badge>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[{ icon: Star, label: 'Stars' }, { icon: GitBranch, label: 'Branches' }, { icon: GitCommitHorizontal, label: 'Commits' }].map((m) => (
                <div key={m.label} className="rounded-lg border border-border bg-background/50 p-3 text-center">
                  <m.icon className="mx-auto mb-1 size-4 text-muted-foreground" />
                  <div className="text-[11px] text-muted-foreground">{m.label}</div>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              {LANGUAGES.slice(0, 3).map((lang, i) => (
                <div key={lang.name} className="flex items-center gap-3 text-xs">
                  <span className="w-20 text-muted-foreground">{lang.name}</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full" style={{ width: `${[78, 14, 8][i]}%`, backgroundColor: lang.color }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-xs text-success">
              <Lock className="size-3.5" /> Delivered securely on purchase — license key auto-issued
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}

/* ----------------------------- WORKFLOW --------------------------- */
function Workflow() {
  return (
    <section className="border-y border-border/60 bg-muted/20 py-20">
      <div className="container">
        <SectionHeading eyebrow="How it works" title="From repo to revenue in minutes"
          description="No invoices, no back-and-forth, no manual delivery. Just connect, list, and get paid." />
        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {workflow.map((w, i) => (
            <div key={w.step} className="relative">
              {i < workflow.length - 1 && <div className="absolute left-[calc(50%+2rem)] top-6 hidden h-px w-[calc(100%-4rem)] bg-gradient-to-r from-border to-transparent lg:block" />}
              <div className="mb-4 grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white shadow-lg"><Icon name={w.icon} className="size-5" /></div>
              <div className="mb-1 font-mono text-xs text-muted-foreground">{w.step}</div>
              <h3 className="text-lg font-semibold">{w.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{w.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* -------------------------- FEATURED REPOS ------------------------ */
function FeaturedRepos({ products }: { products: Repo[] }) {
  if (products.length === 0) {
    return (
      <section className="container py-20">
        <SectionHeading eyebrow="Marketplace" title="Be the first to list"
          description="The marketplace is just getting started. List your project and reach developers worldwide." />
        <div className="mt-8 flex justify-center">
          <Button size="lg" variant="gradient" asChild><Link href="/auth/register"><Github className="size-4" /> Start selling</Link></Button>
        </div>
      </section>
    )
  }
  return (
    <section className="container py-20">
      <div className="mb-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <SectionHeading center={false} eyebrow="Fresh listings" title="Featured projects"
          description="Hand-picked, high-quality repositories from our creators." />
        <Button variant="ghost" asChild className="shrink-0"><Link href="/products">Browse all <ArrowRight className="size-4" /></Link></Button>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((r) => <ProductCard key={r.id} repo={r} />)}
      </div>
    </section>
  )
}

/* ------------------------- TECHNOLOGIES --------------------------- */
function Technologies() {
  return (
    <section className="container py-16">
      <SectionHeading eyebrow="Popular technologies" title="Built with the stacks you love" />
      <div className="mt-10 flex flex-wrap justify-center gap-3">
        {TECHS.map((t) => (
          <Link key={t} href={`/products?tech=${encodeURIComponent(t)}`}
            className="group inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
            {t}
          </Link>
        ))}
      </div>
    </section>
  )
}

/* --------------------------- SELLERS ------------------------------ */
function FeaturedSellers({ sellers }: { sellers: Seller[] }) {
  if (sellers.length === 0) return null
  return (
    <section className="container py-20">
      <SectionHeading eyebrow="Featured creators" title="Meet the top sellers"
        description="Developers turning their repositories into real, recurring income." />
      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {sellers.map((s) => (
          <Card key={s.id} interactive className="p-6 text-center">
            <Avatar className="mx-auto size-16 ring-2 ring-primary/20"><AvatarFallback>{s.name.charAt(0)}</AvatarFallback></Avatar>
            <h3 className="mt-4 font-semibold">{s.name}</h3>
            <p className="text-xs text-muted-foreground">@{s.handle}</p>
            <Badge variant="brand" className="mt-3">{s.badge}</Badge>
            <Separator className="my-4" />
            <div className="flex items-center justify-around text-sm">
              <div><div className="font-semibold">{formatNumber(s.sales)}</div><div className="text-xs text-muted-foreground">sales</div></div>
              <div><div className="flex items-center gap-1 font-semibold"><Star className="size-3.5 fill-amber-400 text-amber-400" /> {s.rating || '—'}</div><div className="text-xs text-muted-foreground">rating</div></div>
              <div><div className="font-semibold">{s.productCount}</div><div className="text-xs text-muted-foreground">products</div></div>
            </div>
          </Card>
        ))}
      </div>
    </section>
  )
}

/* ---------------------------- PRICING ----------------------------- */
function Pricing() {
  return (
    <section className="container py-20">
      <SectionHeading eyebrow="Simple pricing" title="Keep more of what you earn"
        description="Start free and only pay when you sell. Upgrade for lower fees and premium placement." />
      <div className="mx-auto mt-14 grid max-w-5xl gap-6 lg:grid-cols-3">
        {plans.map((p) => (
          <Card key={p.name} className={cn('relative flex flex-col p-7', p.highlighted && 'border-primary/50 shadow-glow ring-1 ring-primary/30')}>
            {p.highlighted && <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">Most popular</Badge>}
            <h3 className="font-display text-xl font-semibold">{p.name}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{p.description}</p>
            <div className="mt-5 flex items-end gap-1"><span className="font-display text-4xl font-bold">{p.price}</span><span className="mb-1 text-sm text-muted-foreground">/ {p.period}</span></div>
            <Badge variant="muted" className="mt-3 w-fit">{p.fee}</Badge>
            <ul className="mt-6 flex-1 space-y-3">
              {p.features.map((f) => <li key={f} className="flex items-start gap-2 text-sm"><Check className="mt-0.5 size-4 shrink-0 text-success" /><span className="text-muted-foreground">{f}</span></li>)}
            </ul>
            <Button className="mt-7" variant={p.highlighted ? 'gradient' : 'outline'} asChild><Link href="/auth/register">{p.cta}</Link></Button>
          </Card>
        ))}
      </div>
    </section>
  )
}

/* ---------------------------- SECURITY ---------------------------- */
function Security() {
  const items = [
    { icon: ShieldCheck, title: 'Malware & secret scanning', desc: 'Every upload is scanned automatically before it can go live.' },
    { icon: Lock, title: 'Encrypted delivery', desc: 'Signed, expiring download links and private-repo invites only.' },
    { icon: BadgeCheck, title: 'Human review', desc: 'A real person checks quality and licensing on every listing.' },
    { icon: Wallet, title: 'Buyer protection', desc: '14-day protection window with fair, mediated dispute resolution.' },
  ]
  return (
    <section className="container py-20">
      <div className="overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-card to-muted/30 p-8 sm:p-12">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_1.4fr] lg:items-center">
          <div className="space-y-4">
            <Badge variant="brand" className="px-3 py-1"><ShieldCheck className="size-3" /> Trust & security</Badge>
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Safe for buyers.<br />Fair for sellers.</h2>
            <p className="text-muted-foreground">We treat security as a feature, not an afterthought. Payments run on Stripe, code is scanned and reviewed, and every transaction is backed by our protection guarantee.</p>
            <Button variant="outline" asChild><Link href="/trust">Read our trust center <ArrowUpRight className="size-4" /></Link></Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {items.map((it) => (
              <div key={it.title} className="rounded-xl border border-border bg-background/50 p-5">
                <it.icon className="mb-3 size-6 text-primary" />
                <h3 className="font-semibold">{it.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{it.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------ FAQ ------------------------------- */
function Faq() {
  return (
    <section className="container py-20">
      <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
        <SectionHeading center={false} eyebrow="FAQ" title="Questions, answered"
          description="Everything you need to know about buying and selling on AIAppsBase." />
        <FaqSection />
      </div>
    </section>
  )
}

/* ------------------------- NEWSLETTER CTA ------------------------- */
function NewsletterCta() {
  return (
    <section className="container pb-24 pt-4">
      <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-10 text-center sm:p-16">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-grid bg-grid-pattern opacity-20" />
          <div className="absolute -left-10 top-0 h-60 w-60 rounded-full bg-white/10 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-2xl space-y-6 text-white">
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Start selling your projects today</h2>
          <p className="text-lg text-white/80">Get product tips, new-listing alerts, and marketplace insights — no spam, unsubscribe anytime.</p>
          <div className="mx-auto max-w-md"><NewsletterForm /></div>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-2 text-sm text-white/70">
            <span className="inline-flex items-center gap-1.5"><Check className="size-4" /> Free to start</span>
            <span className="inline-flex items-center gap-1.5"><Check className="size-4" /> No listing fees</span>
            <span className="inline-flex items-center gap-1.5"><Check className="size-4" /> Instant payouts</span>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------ PAGE ------------------------------ */
export default async function HomePage() {
  const [featured, sellers, stats] = await Promise.all([
    getFeaturedProducts(6), getTopSellers(4), getPlatformStats(),
  ])

  const jsonLd = faqJsonLd(faqs)

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Hero stats={stats} sellers={sellers} />
      <TrustedBy />
      <Stats stats={stats} />
      <Categories />
      <Features />
      <GithubIntegration />
      <Workflow />
      <FeaturedRepos products={featured} />
      <Technologies />
      <FeaturedSellers sellers={sellers} />
      <Pricing />
      <Security />
      <Faq />
      <NewsletterCta />
    </>
  )
}
