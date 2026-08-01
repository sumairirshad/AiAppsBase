import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'

import { ProductDetail } from '@/components/marketplace/product-detail'
import { getProductById, getRelatedProducts } from '@/lib/products'
import { absoluteUrl, breadcrumbJsonLd, extractProductId, productJsonLd, productPath } from '@/lib/seo'

export const revalidate = 300

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const found = await getProductById(extractProductId(params.id))
  if (!found) return { title: 'Project not found' }
  const { repo } = found
  const url = absoluteUrl(productPath(repo))
  const title = `${repo.title} — ${repo.category}`
  const description = repo.description

  return {
    title,
    description,
    keywords: [repo.category, repo.subcategory, repo.language, repo.aiTool, ...repo.techStack].filter(Boolean),
    alternates: { canonical: url },
    openGraph: { title, description, url, type: 'website' },
    twitter: { card: 'summary_large_image', title, description },
  }
}

export default async function ProductPage({ params }: { params: { id: string } }) {
  const id = extractProductId(params.id)
  const found = await getProductById(id)
  if (!found) notFound()

  const { repo, seller } = found
  const canonicalPath = productPath(repo)
  if (`/product/${params.id}` !== canonicalPath) {
    permanentRedirect(canonicalPath)
  }

  const related = await getRelatedProducts(repo, 3)

  const jsonLd = [
    productJsonLd(repo, seller),
    breadcrumbJsonLd([
      { name: 'Marketplace', path: '/products' },
      { name: repo.category, path: `/products?category=${repo.categorySlug}` },
      { name: repo.title, path: canonicalPath },
    ]),
  ]

  return (
    <>
      {jsonLd.map((entry, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(entry) }}
        />
      ))}
      <ProductDetail repo={repo} seller={seller ?? undefined} related={related} />
    </>
  )
}
