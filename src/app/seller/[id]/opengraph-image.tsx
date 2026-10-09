import { ImageResponse } from 'next/og'

import { getSellerById } from '@/lib/products'
import { extractProductId, SITE_NAME } from '@/lib/seo'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function SellerOpengraphImage({ params }: { params: { id: string } }) {
  const seller = await getSellerById(extractProductId(params.id))
  const name = seller?.name ?? SITE_NAME
  const handle = seller?.handle ? `@${seller.handle}` : ''
  const stats = seller
    ? [
        `${seller.productCount} product${seller.productCount === 1 ? '' : 's'}`,
        seller.reviewCount ? `${seller.rating}★ rating` : null,
      ].filter(Boolean).join('  ·  ')
    : ''

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 72,
          background: 'linear-gradient(135deg, #0b1020 0%, #1e1440 55%, #3b0f3d 100%)',
          color: 'white',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 28, fontWeight: 700 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #6366f1 0%, #d946ef 100%)',
              fontSize: 20,
            }}
          >
            A
          </div>
          {SITE_NAME}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div
            style={{
              display: 'flex',
              fontSize: 22,
              color: '#c4b5fd',
              textTransform: 'uppercase',
              letterSpacing: 2,
            }}
          >
            Seller storefront
          </div>
          <div style={{ display: 'flex', fontSize: 58, fontWeight: 700, lineHeight: 1.1, maxWidth: 1000 }}>
            {name}
          </div>
          {handle && <div style={{ display: 'flex', fontSize: 26, color: '#9ca3af' }}>{handle}</div>}
        </div>

        <div style={{ display: 'flex', fontSize: 32, fontWeight: 600, color: '#a3e635' }}>{stats}</div>
      </div>
    ),
    { ...size }
  )
}
