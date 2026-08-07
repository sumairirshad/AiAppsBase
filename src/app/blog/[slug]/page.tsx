import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { ArrowLeft, Clock, Calendar, List } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Breadcrumbs } from '@/components/seo/breadcrumbs'
import { Faq } from '@/components/seo/faq'
import { JsonLd } from '@/components/seo/json-ld'
import { articleSchema } from '@/lib/seo'
import { posts, getPost, slugifyHeading, type BlogBlock } from '@/lib/blog-data'

export function generateStaticParams() {
  return posts.map((p) => ({ slug: p.slug }))
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const post = getPost(params.slug)
  if (!post) return { title: 'Article not found' }
  const title = post.seoTitle ?? post.title
  return {
    title,
    description: post.metaDescription,
    alternates: { canonical: `/blog/${post.slug}` },
    keywords: post.tags,
    authors: [{ name: post.author }],
    openGraph: {
      title,
      description: post.metaDescription,
      type: 'article',
      url: `/blog/${post.slug}`,
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      authors: [post.author],
      section: post.category,
      tags: post.tags,
      images: [{ url: post.coverImage, alt: post.coverImageAlt }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: post.metaDescription,
      images: [post.coverImage],
    },
  }
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = getPost(params.slug)
  if (!post) notFound()

  const related = posts.filter((p) => p.slug !== post.slug).slice(0, 3)
  const headings = post.content.filter(
    (b): b is Extract<BlogBlock, { type: 'h2' } | { type: 'h3' }> => b.type === 'h2' || b.type === 'h3'
  )
  const showToc = headings.length >= 3

  return (
    <article className="py-10">
      <JsonLd
        data={articleSchema({
          headline: post.title,
          description: post.metaDescription,
          slug: post.slug,
          datePublished: post.publishedAt,
          dateModified: post.updatedAt,
          authorName: post.author,
          section: post.category,
        })}
      />

      <div className="container max-w-3xl">
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Blog', href: '/blog' },
            { label: post.title, href: `/blog/${post.slug}` },
          ]}
        />
        <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> All articles
        </Link>

        <div className="mt-6 space-y-4">
          <Badge variant="brand">{post.category}</Badge>
          <h1 className="font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl">{post.title}</h1>
          <p className="text-lg text-muted-foreground">{post.excerpt}</p>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Avatar className="size-9"><AvatarFallback>{post.author.charAt(0)}</AvatarFallback></Avatar>
              <div>
                <div className="font-medium text-foreground">{post.author}</div>
                <div className="text-xs">{post.authorRole}</div>
              </div>
            </div>
            <span className="inline-flex items-center gap-1"><Calendar className="size-4" /> {post.date}</span>
            <span className="inline-flex items-center gap-1"><Clock className="size-4" /> {post.readTime}</span>
          </div>
        </div>
      </div>

      <div className="relative mx-auto mt-8 h-64 max-w-5xl overflow-hidden rounded-2xl sm:h-80">
        <Image
          src={post.coverImage}
          alt={post.coverImageAlt}
          fill
          priority
          sizes="(min-width: 1024px) 1024px, 100vw"
          className="object-cover"
        />
      </div>

      <div className="container mt-10 max-w-3xl">
        {showToc && (
          <Card className="mb-10 p-5">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <List className="size-4 text-primary" /> In this article
            </div>
            <ul className="space-y-1.5">
              {headings.map((h, i) => (
                <li key={i} className={cn('text-sm', h.type === 'h3' && 'pl-4')}>
                  <a href={`#${slugifyHeading(h.text)}`} className="text-muted-foreground hover:text-primary">
                    {h.text}
                  </a>
                </li>
              ))}
            </ul>
          </Card>
        )}

        <div className="space-y-5 leading-relaxed">
          {post.content.map((b, i) => {
            if (b.type === 'h2') return (
              <h2 key={i} id={slugifyHeading(b.text)} className="scroll-mt-24 pt-4 font-display text-2xl font-bold tracking-tight">
                {b.text}
              </h2>
            )
            if (b.type === 'h3') return (
              <h3 key={i} id={slugifyHeading(b.text)} className="scroll-mt-24 pt-2 font-display text-xl font-semibold tracking-tight">
                {b.text}
              </h3>
            )
            if (b.type === 'quote') return (
              <blockquote key={i} className="border-l-2 border-primary pl-4 text-lg font-medium italic text-foreground">
                {b.text}
                {b.attribution && <footer className="mt-2 text-sm not-italic font-normal text-muted-foreground">— {b.attribution}</footer>}
              </blockquote>
            )
            if (b.type === 'ul') return (
              <ul key={i} className="space-y-2">
                {b.items.map((it) => (
                  <li key={it} className="flex items-start gap-2 text-muted-foreground">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" /> {it}
                  </li>
                ))}
              </ul>
            )
            if (b.type === 'ol') return (
              <ol key={i} className="space-y-2">
                {b.items.map((it, idx) => (
                  <li key={it} className="flex items-start gap-2.5 text-muted-foreground">
                    <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-primary/12 text-xs font-semibold text-primary">
                      {idx + 1}
                    </span>
                    {it}
                  </li>
                ))}
              </ol>
            )
            return <p key={i} className="text-muted-foreground">{b.text}</p>
          })}
        </div>

        {post.faqs.length > 0 && (
          <>
            <Separator className="my-12" />
            <h2 className="mb-2 font-display text-2xl font-bold tracking-tight">Frequently asked questions</h2>
            <Faq items={post.faqs} />
          </>
        )}

        {post.relatedLinks.length > 0 && (
          <>
            <Separator className="my-12" />
            <h2 className="mb-4 font-display text-2xl font-bold tracking-tight">Useful resources</h2>
            <ul className="grid gap-2 sm:grid-cols-2">
              {post.relatedLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm font-medium text-primary hover:underline">
                    {l.label} &rarr;
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}

        <Separator className="my-12" />

        <h2 className="mb-6 font-display text-2xl font-bold tracking-tight">Keep reading</h2>
        <div className="grid gap-6 sm:grid-cols-3">
          {related.map((p) => (
            <Link key={p.slug} href={`/blog/${p.slug}`}>
              <Card interactive className="group h-full overflow-hidden">
                <div className="relative h-28 overflow-hidden">
                  <Image
                    src={p.coverImage}
                    alt={p.coverImageAlt}
                    fill
                    sizes="(min-width: 640px) 33vw, 100vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-sm font-semibold group-hover:text-primary">{p.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{p.readTime}</p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </article>
  )
}
