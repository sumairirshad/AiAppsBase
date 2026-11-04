import Link from 'next/link'
import { Key } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { PageHead } from '@/components/dashboard/page-head'
import { EmptyState } from '@/components/dashboard/empty-state'
import { getCurrentUser, getBuyerOrders } from '@/lib/dashboard'
import { ProductImage } from '@/components/products/product-image'
import { MalwareDownloadButton } from '@/components/buyer/malware-download-button'

export const dynamic = 'force-dynamic'

export default async function BuyerDownloadsPage() {
  const user = await getCurrentUser()
  const orders = (await getBuyerOrders(user?.id ?? '', 100)).filter((o) => o.status === 'completed')

  return (
    <div className="mx-auto max-w-4xl">
      <PageHead title="Downloads" description="Every project you have access to." />
      {orders.length === 0 ? (
        <EmptyState icon="Download" title="Nothing to download yet" description="Files from your completed purchases will appear here." actionLabel="Browse marketplace" actionHref="/products" />
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <Card key={o.id}>
              <CardContent className="flex items-center gap-4 p-4">
                <span className="relative size-12 shrink-0 overflow-hidden rounded-lg"><ProductImage src={o.image} alt={o.product} logoClassName="size-7" sizes="64px" /></span>
                <div className="min-w-0 flex-1">
                  <Link href={`/product/${o.productId}`} className="font-medium hover:text-primary">{o.product}</Link>
                  <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Key className="size-3" /> <span className="font-mono">{o.licenseKey}</span> · {o.license}
                  </div>
                </div>
                {o.downloadable ? (
                  <MalwareDownloadButton orderId={o.id} productTitle={o.product} />
                ) : (
                  <span className="text-xs text-muted-foreground">No file attached</span>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
