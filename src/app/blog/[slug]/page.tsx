import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Clock, Calendar } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { posts, getPost } from '@/lib/blog-data'
import { absoluteUrl, articleJsonLd } from '@/lib/seo'

export function generateStaticParams() {
  return posts.map((p) => ({ slug: p.slug }))
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const post = getPost(params.slug)
  if (!post) return { title: 'Article not found' }
  const url = absoluteUrl(`/blog/${post.slug}`)
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: url },
    openGraph: { title: post.title, description: post.excerpt, url, type: 'article', publishedTime: post.date },
    twitter: { card: 'summary_large_image', title: post.title, description: post.excerpt },
  }
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = getPost(params.slug)
  if (!post) notFound()

  const related = posts.filter((p) => p.slug !== post.slug).slice(0, 3)
  const jsonLd = articleJsonLd(post)

  return (
    <article className="py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="container max-w-3xl">
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

      <div className={cn('relative mx-auto mt-8 h-64 max-w-5xl overflow-hidden rounded-2xl bg-gradient-to-br sm:h-80', post.gradient)}>
        <div className="absolute inset-0 bg-grid bg-grid-pattern opacity-20" />
      </div>

      <div className="container mt-10 max-w-3xl">
        <div className="space-y-5 leading-relaxed">
          {post.content.map((b, i) => {
            if (b.type === 'h2') return <h2 key={i} className="pt-4 font-display text-2xl font-bold tracking-tight">{b.text}</h2>
            if (b.type === 'quote') return (
              <blockquote key={i} className="border-l-2 border-primary pl-4 text-lg font-medium italic text-foreground">{b.text}</blockquote>
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
            return <p key={i} className="text-muted-foreground">{b.text}</p>
          })}
        </div>

        <Separator className="my-12" />

        <h2 className="mb-6 font-display text-2xl font-bold tracking-tight">Keep reading</h2>
        <div className="grid gap-6 sm:grid-cols-3">
          {related.map((p) => (
            <Link key={p.slug} href={`/blog/${p.slug}`}>
              <Card interactive className="group h-full overflow-hidden">
                <div className={cn('relative h-28 bg-gradient-to-br', p.gradient)}>
                  <div className="absolute inset-0 bg-grid bg-grid-pattern opacity-20" />
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
