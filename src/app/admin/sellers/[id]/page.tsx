import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Mail, Calendar, Star, DollarSign, Package, ShoppingBag } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { StatCard } from '@/components/dashboard/stat-card'
import { EmptyState } from '@/components/dashboard/empty-state'
import { SellerDetailActions } from '@/components/dashboard/seller-detail-actions'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { getSellerDetail } from '@/lib/admin-data'

export const dynamic = 'force-dynamic'

const statusVariant: Record<string, 'success' | 'warning' | 'destructive' | 'muted'> = {
  active: 'success', suspended: 'warning', blocked: 'destructive', banned: 'destructive', inactive: 'muted',
  pending: 'warning', approved: 'success', rejected: 'destructive',
}

export default async function AdminSellerDetailPage({ params }: { params: { id: string } }) {
  const seller = await getSellerDetail(params.id)
  if (!seller) notFound()

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Link href="/admin/sellers" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to providers
      </Link>

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <Avatar className="size-14"><AvatarFallback className="text-lg">{seller.name.charAt(0).toUpperCase()}</AvatarFallback></Avatar>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">{seller.name}</h1>
            <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="size-3.5" /> {seller.email}
            </div>
          </div>
        </div>
        <SellerDetailActions sellerId={seller.id} currentStatus={seller.sellerStatus} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={statusVariant[seller.sellerStatus] ?? 'muted'} className="capitalize">provider: {seller.sellerStatus}</Badge>
        <Badge variant={statusVariant[seller.accountStatus] ?? 'muted'} className="capitalize">account: {seller.accountStatus}</Badge>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Calendar className="size-3.5" /> Member since {new Date(seller.memberSince).toLocaleDateString()}
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Revenue" value={seller.revenue} prefix="$" icon={DollarSign} />
        <StatCard label="Sales" value={seller.sales} icon={ShoppingBag} />
        <StatCard label="Products" value={seller.productCount} icon={Package} />
        <StatCard label="Avg. rating" value={seller.avgRating || 0} icon={Star} />
      </div>

      <Tabs defaultValue="products">
        <TabsList>
          <TabsTrigger value="products">Products ({seller.products.length})</TabsTrigger>
          <TabsTrigger value="reviews">Reviews ({seller.reviews.length})</TabsTrigger>
          <TabsTrigger value="history">Account history ({seller.auditLog.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="products">
          <Card>
            <CardHeader><CardTitle>Products listed</CardTitle></CardHeader>
            <CardContent className={seller.products.length ? 'p-0' : ''}>
              {seller.products.length === 0 ? (
                <EmptyState icon="Package" title="No products" description="This provider hasn't listed any products yet." className="border-0" />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                        <th className="px-6 py-3 font-medium">Product</th><th className="px-6 py-3 font-medium">Status</th>
                        <th className="px-6 py-3 font-medium">Price</th><th className="px-6 py-3 font-medium">Sales</th><th className="px-6 py-3 font-medium">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {seller.products.map((p: any) => (
                        <tr key={p.id} className="border-b border-border/60 last:border-0 hover:bg-muted/40">
                          <td className="px-6 py-3"><Link href={`/product/${p.id}`} className="hover:text-primary">{p.title}</Link></td>
                          <td className="px-6 py-3"><Badge variant={statusVariant[p.status] ?? 'muted'} className="capitalize">{p.status}</Badge></td>
                          <td className="px-6 py-3">${Number(p.price).toFixed(2)}</td>
                          <td className="px-6 py-3">{p.sales}</td>
                          <td className="px-6 py-3 font-medium">${Math.round(p.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews">
          <Card>
            <CardHeader><CardTitle>Reviews received</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {seller.reviews.length === 0 ? (
                <EmptyState icon="Star" title="No reviews" description="Reviews on this provider's products will appear here." className="border-0" />
              ) : seller.reviews.map((r: any) => (
                <div key={r.id} className="rounded-lg border border-border p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{r.product}</span>
                    <span className="text-xs text-muted-foreground">{r.date}</span>
                  </div>
                  <p className="mt-1 text-muted-foreground">{r.author}: {r.comment}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader><CardTitle>Account history</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {seller.auditLog.length === 0 ? (
                <EmptyState icon="ClipboardList" title="No actions recorded" description="Administrative actions taken on this provider will appear here." className="border-0" />
              ) : seller.auditLog.map((a: any) => (
                <div key={a.id} className="rounded-lg border border-border p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium capitalize">{a.action.replace(/[._]/g, ' ')}</span>
                    <span className="text-xs text-muted-foreground">{a.date}</span>
                  </div>
                  <p className="mt-1 text-muted-foreground">Reason: {a.reason}</p>
                  {a.notes && <p className="mt-0.5 text-muted-foreground">Notes: {a.notes}</p>}
                  <p className="mt-1 text-xs text-muted-foreground">By {a.admin_name}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
