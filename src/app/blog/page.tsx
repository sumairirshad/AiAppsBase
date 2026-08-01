import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Clock, Sparkles } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Breadcrumbs } from '@/components/seo/breadcrumbs'
import { JsonLd } from '@/components/seo/json-ld'
import { collectionPageSchema } from '@/lib/seo'
import { posts, blogCategories } from '@/lib/blog-data'

export const metadata: Metadata = {
  title: 'Blog — AI Tools, Tips & Marketplace Insights',
  description:
    'Read the latest articles on AI tools, productivity, automation, marketing, and how to build and sell apps with AI — from the AIAppsBase team.',
  alternates: { canonical: '/blog' },
  openGraph: {
    title: 'AIAppsBase Blog — AI Tools, Tips & Insights',
    description: 'Articles on AI tools, productivity, automation, and building and selling with AI.',
    type: 'website',
    url: '/blog',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AIAppsBase Blog — AI Tools, Tips & Insights',
    description: 'Articles on AI tools, productivity, automation, and building and selling with AI.',
  },
}

export default function BlogPage() {
  const featured = posts.filter((p) => p.featured)
  const rest = posts.filter((p) => !p.featured)

  return (
    <div className="container py-16">
      <JsonLd
        data={collectionPageSchema({
          name: 'AIAppsBase Blog',
          description: 'Articles on AI tools, productivity, automation, and building and selling with AI.',
          url: '/blog',
        })}
      />
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Blog', href: '/blog' }]} />

      <div className="mx-auto max-w-2xl text-center">
        <Badge variant="brand" className="px-3 py-1"><Sparkles className="size-3" /> The AIAppsBase Blog</Badge>
        <h1 className="mt-4 font-display text-4xl font-bold tracking-tight sm:text-5xl">
          Insights for builders &amp; sellers
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Guides, data, and stories on AI tools, productivity, automation, and building and selling AI-crafted software.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {blogCategories.map((c) => (
            <Badge key={c} variant="muted">{c}</Badge>
          ))}
        </div>
      </div>

      {/* Featured */}
      <div className="mt-14 grid gap-6 lg:grid-cols-2">
        {featured.map((p) => (
          <Link key={p.slug} href={`/blog/${p.slug}`}>
            <Card interactive className="group h-full overflow-hidden">
              <div className="relative h-56 overflow-hidden">
                <Image
                  src={p.coverImage}
                  alt={p.coverImageAlt}
                  fill
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <Badge className="absolute left-4 top-4 border-0 bg-black/30 text-white backdrop-blur-md">{p.category}</Badge>
              </div>
              <div className="p-6">
                <h2 className="font-display text-xl font-bold group-hover:text-primary">{p.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{p.excerpt}</p>
                <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
                  <Avatar className="size-7"><AvatarFallback>{p.author.charAt(0)}</AvatarFallback></Avatar>
                  <span className="font-medium text-foreground">{p.author}</span>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1"><Clock className="size-3" /> {p.readTime}</span>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Rest */}
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {rest.map((p) => (
          <Link key={p.slug} href={`/blog/${p.slug}`}>
            <Card interactive className="group flex h-full flex-col overflow-hidden">
              <div className="relative h-40 overflow-hidden">
                <Image
                  src={p.coverImage}
                  alt={p.coverImageAlt}
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <Badge className="absolute left-4 top-4 border-0 bg-black/30 text-white backdrop-blur-md">{p.category}</Badge>
              </div>
              <div className="flex flex-1 flex-col p-5">
                <h3 className="font-semibold group-hover:text-primary">{p.title}</h3>
                <p className="mt-2 line-clamp-2 flex-1 text-sm text-muted-foreground">{p.excerpt}</p>
                <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{p.author}</span>
                  <span>·</span>
                  <span>{p.readTime}</span>
                  <ArrowRight className="ml-auto size-4 transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
