import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { ProductDetail } from '@/components/marketplace/product-detail'
import { getProductById, getRelatedProducts } from '@/lib/products'
import { JsonLd } from '@/components/seo/json-ld'
import { breadcrumbSchema, softwareApplicationSchema } from '@/lib/seo'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const found = await getProductById(params.id)
  if (!found) return { title: 'Project not found' }
  return {
    title: `${found.repo.title} — ${found.repo.category}`,
    description: found.repo.description,
    alternates: { canonical: `/product/${params.id}` },
    openGraph: {
      title: found.repo.title,
      description: found.repo.description,
      type: 'website',
      url: `/product/${params.id}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: found.repo.title,
      description: found.repo.description,
    },
  }
}

export default async function ProductPage({ params }: { params: { id: string } }) {
  const found = await getProductById(params.id)
  if (!found) notFound()

  const related = await getRelatedProducts(found.repo, 3)
  const { repo } = found

  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema([
            { label: 'Home', href: '/' },
            { label: 'Marketplace', href: '/products' },
            { label: repo.category, href: `/products?category=${repo.categorySlug}` },
            { label: repo.title, href: `/product/${repo.id}` },
          ]),
          softwareApplicationSchema({
            name: repo.title,
            description: repo.description,
            category: repo.category,
            url: `/product/${repo.id}`,
            price: repo.price,
            ratingValue: repo.rating || undefined,
            ratingCount: repo.reviewCount || undefined,
          }),
        ]}
      />
      <ProductDetail repo={repo} seller={found.seller ?? undefined} related={related} />
    </>
  )
}
