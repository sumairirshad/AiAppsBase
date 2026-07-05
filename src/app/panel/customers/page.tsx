import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { PageHead } from '@/components/dashboard/page-head'
import { EmptyState } from '@/components/dashboard/empty-state'
import { getCurrentUser, getSellerCustomers } from '@/lib/dashboard'

export const dynamic = 'force-dynamic'

export default async function SellerCustomersPage() {
  const user = await getCurrentUser()
  const customers = await getSellerCustomers(user?.id ?? '')

  return (
    <div className="mx-auto max-w-7xl">
      <PageHead title="Customers" description="Buyers who have purchased your products." />
      {customers.length === 0 ? (
        <EmptyState icon="Users" title="No customers yet" description="Your customers will appear here after your first sale." />
      ) : (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-6 py-3 font-medium">Customer</th><th className="px-6 py-3 font-medium">Email</th>
                  <th className="px-6 py-3 font-medium">Orders</th><th className="px-6 py-3 font-medium">Spent</th><th className="px-6 py-3 font-medium">Last order</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id} className="border-b border-border/60 last:border-0 hover:bg-muted/40">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8"><AvatarFallback>{c.name.charAt(0)}</AvatarFallback></Avatar>
                        <span className="font-medium">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-muted-foreground">{c.email}</td>
                    <td className="px-6 py-3 text-muted-foreground">{c.orders}</td>
                    <td className="px-6 py-3 font-medium">${c.spent}</td>
                    <td className="px-6 py-3 text-muted-foreground">{c.lastOrder}</td>
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
