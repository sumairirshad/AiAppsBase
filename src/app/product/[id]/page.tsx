import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'

import { ProductDetail } from '@/components/marketplace/product-detail'
import { getProductById, getRelatedProducts } from '@/lib/products'
import { JsonLd } from '@/components/seo/json-ld'
import { breadcrumbSchema, softwareApplicationSchema, extractProductId, productPath } from '@/lib/seo'

export const revalidate = 300

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const found = await getProductById(extractProductId(params.id))
  if (!found) return { title: 'Project not found' }
  const { repo } = found
  const path = productPath(repo)

  return {
    title: `${repo.title} — ${repo.category}`,
    description: repo.description,
    keywords: [repo.category, repo.subcategory, repo.language, repo.aiTool, ...repo.techStack].filter(Boolean),
    alternates: { canonical: path },
    openGraph: {
      title: repo.title,
      description: repo.description,
      type: 'website',
      url: path,
    },
    twitter: {
      card: 'summary_large_image',
      title: repo.title,
      description: repo.description,
    },
  }
}

export default async function ProductPage({ params }: { params: { id: string } }) {
  const id = extractProductId(params.id)
  const found = await getProductById(id)
  if (!found) notFound()

  const { repo } = found
  const canonicalPath = productPath(repo)
  if (`/product/${params.id}` !== canonicalPath) {
    permanentRedirect(canonicalPath)
  }

  const related = await getRelatedProducts(repo, 3)

  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema([
            { label: 'Home', href: '/' },
            { label: 'Marketplace', href: '/products' },
            { label: repo.category, href: `/products?category=${repo.categorySlug}` },
            { label: repo.title, href: canonicalPath },
          ]),
          softwareApplicationSchema({
            name: repo.title,
            description: repo.description,
            category: repo.category,
            url: canonicalPath,
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
