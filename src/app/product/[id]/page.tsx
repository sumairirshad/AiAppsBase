import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { ProductDetail } from '@/components/marketplace/product-detail'
import { getProductById, getRelatedProducts } from '@/lib/products'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const found = await getProductById(params.id)
  if (!found) return { title: 'Project not found' }
  return {
    title: `${found.repo.title} — ${found.repo.category}`,
    description: found.repo.description,
    openGraph: { title: found.repo.title, description: found.repo.description },
  }
}

export default async function ProductPage({ params }: { params: { id: string } }) {
  const found = await getProductById(params.id)
  if (!found) notFound()

  const related = await getRelatedProducts(found.repo, 3)

  return <ProductDetail repo={found.repo} seller={found.seller ?? undefined} related={related} />
}
