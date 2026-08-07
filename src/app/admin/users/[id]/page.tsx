import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Mail, Github, Calendar, ShieldCheck } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { PageHead } from '@/components/dashboard/page-head'
import { EmptyState } from '@/components/dashboard/empty-state'
import { UserDetailActions } from '@/components/dashboard/user-detail-actions'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { getAdminUserDetail } from '@/lib/admin-data'

export const dynamic = 'force-dynamic'

const statusVariant: Record<string, 'success' | 'warning' | 'destructive' | 'muted'> = {
  active: 'success', suspended: 'warning', blocked: 'destructive', banned: 'destructive', inactive: 'muted',
  completed: 'success', refunded: 'destructive', disputed: 'warning',
  pending: 'warning', approved: 'success', rejected: 'destructive',
}

export default async function AdminUserDetailPage({ params }: { params: { id: string } }) {
  const user = await getAdminUserDetail(params.id)
  if (!user) notFound()

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Link href="/admin/users" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to users
      </Link>

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <Avatar className="size-14"><AvatarFallback className="text-lg">{user.name.charAt(0).toUpperCase()}</AvatarFallback></Avatar>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">{user.name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <Mail className="size-3.5" /> {user.email}
              {user.githubUsername && <><Github className="ml-2 size-3.5" /> {user.githubUsername}</>}
            </div>
          </div>
        </div>
        <UserDetailActions userId={user.id} currentStatus={user.accountStatus} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="brand" className="capitalize">{user.role}</Badge>
        <Badge variant={statusVariant[user.accountStatus] ?? 'muted'} className="capitalize">{user.accountStatus}</Badge>
        {user.role === 'seller' && user.sellerStatus && (
          <Badge variant={statusVariant[user.sellerStatus] ?? 'muted'} className="capitalize">provider: {user.sellerStatus}</Badge>
        )}
        {user.isVerified && <Badge variant="success"><ShieldCheck className="size-3" /> Email verified</Badge>}
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Calendar className="size-3.5" /> Member since {new Date(user.memberSince).toLocaleDateString()}
        </span>
      </div>

      <Tabs defaultValue="orders">
        <TabsList>
          <TabsTrigger value="orders">Bookings ({user.orders.length})</TabsTrigger>
          <TabsTrigger value="reviews">Reviews ({user.reviews.length})</TabsTrigger>
          {user.role === 'seller' && <TabsTrigger value="products">Products ({user.products.length})</TabsTrigger>}
          <TabsTrigger value="history">Account history ({user.auditLog.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="orders">
          <Card>
            <CardHeader><CardTitle>Booking history</CardTitle></CardHeader>
            <CardContent className={user.orders.length ? 'p-0' : ''}>
              {user.orders.length === 0 ? (
                <EmptyState icon="ShoppingBag" title="No bookings" description="This user hasn't purchased anything yet." className="border-0" />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                        <th className="px-6 py-3 font-medium">Order</th><th className="px-6 py-3 font-medium">Product</th>
                        <th className="px-6 py-3 font-medium">Amount</th><th className="px-6 py-3 font-medium">Status</th><th className="px-6 py-3 font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {user.orders.map((o: any) => (
                        <tr key={o.id} className="border-b border-border/60 last:border-0 hover:bg-muted/40">
                          <td className="px-6 py-3 font-mono text-xs">{String(o.id).slice(0, 12)}</td>
                          <td className="px-6 py-3">{o.product}</td>
                          <td className="px-6 py-3 font-medium">${Math.round(o.amount)}</td>
                          <td className="px-6 py-3"><Badge variant={statusVariant[o.status] ?? 'muted'}>{o.status}</Badge></td>
                          <td className="px-6 py-3 text-muted-foreground">{o.date}</td>
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
            <CardHeader><CardTitle>Reviews written</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {user.reviews.length === 0 ? (
                <EmptyState icon="Star" title="No reviews" description="This user hasn't written any reviews yet." className="border-0" />
              ) : user.reviews.map((r: any) => (
                <div key={r.id} className="rounded-lg border border-border p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{r.product}</span>
                    <span className="text-xs text-muted-foreground">{r.date}</span>
                  </div>
                  <p className="mt-1 text-muted-foreground">{r.comment}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {user.role === 'seller' && (
          <TabsContent value="products">
            <Card>
              <CardHeader><CardTitle>Products listed</CardTitle></CardHeader>
              <CardContent className={user.products.length ? 'p-0' : ''}>
                {user.products.length === 0 ? (
                  <EmptyState icon="Package" title="No products" description="This seller hasn't listed any products yet." className="border-0" />
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
                        {user.products.map((p: any) => (
                          <tr key={p.id} className="border-b border-border/60 last:border-0 hover:bg-muted/40">
                            <td className="px-6 py-3">
                              <Link href={`/product/${p.id}`} className="hover:text-primary">{p.title}</Link>
                            </td>
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
        )}

        <TabsContent value="history">
          <Card>
            <CardHeader><CardTitle>Account history</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {user.auditLog.length === 0 ? (
                <EmptyState icon="ClipboardList" title="No actions recorded" description="Administrative actions taken on this account will appear here." className="border-0" />
              ) : user.auditLog.map((a: any) => (
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
