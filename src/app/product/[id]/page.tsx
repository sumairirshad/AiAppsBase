import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { ProductDetail } from '@/components/marketplace/product-detail'
import { products, getProduct, getSeller, getRelated } from '@/lib/marketplace-data'

export function generateStaticParams() {
  return products.map((p) => ({ id: p.id }))
}

export function generateMetadata({ params }: { params: { id: string } }): Metadata {
  const repo = getProduct(params.id)
  if (!repo) return { title: 'Project not found' }
  return {
    title: `${repo.title} — ${repo.category}`,
    description: repo.description,
    openGraph: { title: repo.title, description: repo.description },
  }
}

export default function ProductPage({ params }: { params: { id: string } }) {
  const repo = getProduct(params.id)
  if (!repo) notFound()

  const seller = getSeller(repo.sellerId)
  const related = getRelated(repo, 3)

  return <ProductDetail repo={repo} seller={seller} related={related} />
}
