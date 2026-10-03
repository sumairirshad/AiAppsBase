import type { Metadata } from 'next'
import Link from 'next/link'
import { Star, BadgeCheck, Trophy } from 'lucide-react'

import { InfoPage } from '@/components/layout/info-page'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatNumber } from '@/lib/utils'
import { listPublicSellers } from '@/lib/products'
import { sellerPath } from '@/lib/seo'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Top sellers on AIAppsBase',
  description: 'Meet the developers turning their repositories into thriving businesses. Browse creator storefronts ranked by sales and rating.',
  alternates: { canonical: '/top-sellers' },
}

export default async function Page() {
  const sellers = await listPublicSellers(48)

  if (sellers.length === 0) {
    return (
      <InfoPage
        eyebrow="Creators"
        title="Top sellers on AIAppsBase"
        description="No storefronts are live yet. Be one of the first creators to sell on AIAppsBase."
        icon="Trophy"
        actions={[{ label: 'Browse the marketplace', href: '/products', variant: 'gradient' }, { label: 'Become a seller', href: '/auth/register', variant: 'outline' }]}
      />
    )
  }

  return (
    <div className="container py-16">
      <div className="mx-auto max-w-2xl text-center">
        <Badge variant="brand" className="px-3 py-1"><Trophy className="size-3" /> Creators</Badge>
        <h1 className="mt-5 font-display text-4xl font-bold tracking-tight sm:text-5xl">Top sellers on AIAppsBase</h1>
        <p className="mt-4 text-lg text-muted-foreground">Developers turning their repositories into real, recurring income. Ranked by completed sales.</p>
      </div>

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {sellers.map((s, i) => (
          <Link key={s.id} href={sellerPath(s)} className="block">
            <Card interactive className="relative h-full p-6 text-center">
              <span className="absolute left-4 top-4 font-mono text-xs text-muted-foreground">#{i + 1}</span>
              <Avatar className="mx-auto size-16 ring-2 ring-primary/20">
                {s.avatar && <AvatarImage src={s.avatar} alt={s.name} />}
                <AvatarFallback>{s.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <h2 className="mt-4 flex items-center justify-center gap-1 font-semibold">
                {s.name} {s.verified && <BadgeCheck className="size-4 text-primary" />}
              </h2>
              <p className="text-xs text-muted-foreground">@{s.handle}</p>
              {s.badge !== 'Seller' && <Badge variant="brand" className="mt-3">{s.badge}</Badge>}
              <div className="mt-4 flex items-center justify-around border-t border-border pt-4 text-sm">
                <div><div className="font-semibold">{formatNumber(s.sales)}</div><div className="text-xs text-muted-foreground">sales</div></div>
                <div><div className="flex items-center gap-1 font-semibold"><Star className="size-3.5 fill-amber-400 text-amber-400" /> {s.reviewCount ? s.rating : '—'}</div><div className="text-xs text-muted-foreground">rating</div></div>
                <div><div className="font-semibold">{s.productCount}</div><div className="text-xs text-muted-foreground">products</div></div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
