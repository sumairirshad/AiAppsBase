import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'

import { ProductDetail } from '@/components/marketplace/product-detail'
import { getProductById, getRelatedProducts } from '@/lib/products'
import { JsonLd } from '@/components/seo/json-ld'
import {
  breadcrumbSchema, softwareApplicationSchema, extractProductId, productPath,
  productMetaTitle, productMetaDescription, absoluteUrl,
} from '@/lib/seo'

export const revalidate = 300

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const found = await getProductById(extractProductId(params.id))
  if (!found) return { title: 'Product not found', robots: { index: false, follow: true } }
  const { repo } = found
  const path = productPath(repo)
  const title = productMetaTitle(repo.title)
  const description = productMetaDescription(repo)
  // Real product screenshot when the seller uploaded one; otherwise fall
  // back to the per-product generated opengraph-image route (see
  // opengraph-image.tsx in this directory) by not setting `images` at all.
  const image = repo.image ? absoluteUrl(repo.image) : undefined

  return {
    title,
    description,
    keywords: [repo.category, repo.subcategory, repo.language, repo.aiTool, ...repo.techStack, ...repo.tags]
      .filter(Boolean)
      .slice(0, 15),
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      type: 'website',
      url: path,
      ...(image ? { images: [{ url: image, alt: repo.title }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(image ? { images: [image] } : {}),
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
          // Mirrors the visible breadcrumb in ProductDetail exactly (including
          // the subcategory level when the product has one) so the structured
          // data never drifts from what a visitor actually sees.
          breadcrumbSchema([
            { label: 'Home', href: '/' },
            { label: 'Marketplace', href: '/products' },
            { label: repo.category, href: `/products?category=${repo.categorySlug}` },
            ...(repo.subcategory
              ? [{ label: repo.subcategory, href: `/products?subcategory=${repo.subcategorySlug}` }]
              : []),
            { label: repo.title, href: canonicalPath },
          ]),
          softwareApplicationSchema({
            name: repo.title,
            description: repo.description,
            category: repo.category,
            url: canonicalPath,
            image: repo.image || undefined,
            brandName: found.seller?.name,
            price: repo.price,
            ratingValue: repo.rating || undefined,
            ratingCount: repo.reviewCount || undefined,
            keywords: repo.tags,
          }),
        ]}
      />
      <ProductDetail repo={repo} seller={found.seller ?? undefined} related={related} />
    </>
  )
}
