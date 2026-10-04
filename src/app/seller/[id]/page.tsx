import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'

import { StorefrontView } from '@/components/marketplace/storefront'
import { JsonLd } from '@/components/seo/json-ld'
import { getStorefront } from '@/lib/products'
import { breadcrumbSchema, extractProductId, sellerPath, sellerProfileSchema } from '@/lib/seo'

export const revalidate = 300

function describe(name: string, bio: string, productCount: number) {
  if (bio) return bio.length > 160 ? `${bio.slice(0, 157)}…` : bio
  return `Browse ${productCount} AI-built project${productCount === 1 ? '' : 's'} by ${name} on AIAppsBase.`
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const data = await getStorefront(extractProductId(params.id))
  if (!data) return { title: 'Seller not found' }
  const { seller } = data
  const path = sellerPath(seller)
  const description = describe(seller.name, seller.bio, seller.productCount)

  return {
    title: `${seller.name} (@${seller.handle}) — Storefront`,
    description,
    alternates: { canonical: path },
    openGraph: { title: `${seller.name} on AIAppsBase`, description, type: 'profile', url: path },
    twitter: { card: 'summary', title: `${seller.name} on AIAppsBase`, description },
  }
}

export default async function SellerStorefrontPage({ params }: { params: { id: string } }) {
  const data = await getStorefront(extractProductId(params.id))
  if (!data) notFound()

  const { seller } = data
  const canonicalPath = sellerPath(seller)
  if (`/seller/${params.id}` !== canonicalPath) {
    permanentRedirect(canonicalPath)
  }

  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema([
            { label: 'Home', href: '/' },
            { label: 'Top sellers', href: '/top-sellers' },
            { label: seller.name, href: canonicalPath },
          ]),
          sellerProfileSchema({
            name: seller.name,
            description: describe(seller.name, seller.bio, seller.productCount),
            url: canonicalPath,
            sameAs: seller.website ? [seller.website] : undefined,
          }),
        ]}
      />
      <StorefrontView data={data} />
    </>
  )
}
