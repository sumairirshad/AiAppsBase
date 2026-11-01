import Link from 'next/link'
import { Download, FileArchive } from 'lucide-react'

import { formatBytes } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { PageHead } from '@/components/dashboard/page-head'
import { EmptyState } from '@/components/dashboard/empty-state'
import { getCurrentUser, getBuyerDownloadHistory } from '@/lib/dashboard'
import { ProductImage } from '@/components/products/product-image'

export const dynamic = 'force-dynamic'

function formatDateTime(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  })
}

export default async function BuyerDownloadHistoryPage() {
  const user = await getCurrentUser()
  const entries = await getBuyerDownloadHistory(user?.id ?? '', 100)

  return (
    <div className="mx-auto max-w-7xl">
      <PageHead
        title="Download History"
        description="Every file you're entitled to, when the seller uploaded it, and when you last downloaded it."
      />
      {entries.length === 0 ? (
        <EmptyState
          icon="History"
          title="No download history yet"
          description="Files from your completed purchases will appear here once a deliverable is available."
          actionLabel="Browse marketplace"
          actionHref="/products"
        />
      ) : (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-6 py-3 font-medium">File</th>
                  <th className="px-6 py-3 font-medium">Version</th>
                  <th className="px-6 py-3 font-medium">Size</th>
                  <th className="px-6 py-3 font-medium">Seller uploaded</th>
                  <th className="px-6 py-3 font-medium">Your last download</th>
                  <th className="px-6 py-3 font-medium">Times downloaded</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e.orderId} className="border-b border-border/60 last:border-0 hover:bg-muted/40">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <span className="relative size-9 shrink-0 overflow-hidden rounded-md">
                          <ProductImage src={e.image} alt={e.product} logoClassName="size-5" sizes="36px" />
                        </span>
                        <div className="min-w-0">
                          <Link href={`/product/${e.productId}`} className="font-medium hover:text-primary">{e.product}</Link>
                          <div className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
                            <FileArchive className="size-3 shrink-0" />
                            <span className="truncate">{e.fileName || '—'}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3 font-mono text-xs text-muted-foreground">{e.version ? `v${e.version}` : '—'}</td>
                    <td className="px-6 py-3 text-muted-foreground">{e.fileSizeBytes ? formatBytes(e.fileSizeBytes) : '—'}</td>
                    <td className="px-6 py-3 text-muted-foreground">{formatDateTime(e.uploadedAt)}</td>
                    <td className="px-6 py-3">
                      {e.lastDownloadedAt ? (
                        formatDateTime(e.lastDownloadedAt)
                      ) : (
                        <Badge variant="muted">Never downloaded</Badge>
                      )}
                    </td>
                    <td className="px-6 py-3 text-muted-foreground">{e.downloadCount}</td>
                    <td className="px-6 py-3 text-right">
                      <Button size="sm" variant="outline" asChild>
                        <a href={`/api/orders/${e.orderId}/download`}><Download className="size-4" /> Download</a>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
