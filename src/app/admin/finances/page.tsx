import { DollarSign, TrendingUp, Wallet, ShoppingBag } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatCard } from '@/components/dashboard/stat-card'
import { PageHead } from '@/components/dashboard/page-head'
import { EmptyState } from '@/components/dashboard/empty-state'
import { getAdminFinances, getRecentTransactions } from '@/lib/dashboard'

export const dynamic = 'force-dynamic'

const statusVariant: Record<string, 'success' | 'warning' | 'destructive'> = {
  completed: 'success', pending: 'warning', refunded: 'destructive', disputed: 'warning',
}

export default async function AdminFinancesPage() {
  const [fin, transactions] = await Promise.all([getAdminFinances(), getRecentTransactions(25)])

  return (
    <div className="mx-auto max-w-7xl">
      <PageHead title="Finances" description="Platform revenue, commission, and transactions." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Gross revenue" value={fin.revenue} prefix="$" icon={DollarSign} />
        <StatCard label="Platform commission" value={fin.commission} prefix="$" icon={TrendingUp} />
        <StatCard label="Paid to sellers" value={fin.net} prefix="$" icon={Wallet} />
        <StatCard label="Completed sales" value={fin.sales} icon={ShoppingBag} />
      </div>

      <Card className="mt-6">
        <CardHeader><CardTitle>Recent transactions</CardTitle></CardHeader>
        <CardContent className={transactions.length ? 'p-0' : ''}>
          {transactions.length === 0 ? (
            <EmptyState icon="DollarSign" title="No transactions yet" description="Completed orders across the platform will appear here." className="border-0" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-6 py-3 font-medium">Transaction</th><th className="px-6 py-3 font-medium">Product</th>
                    <th className="px-6 py-3 font-medium">Buyer</th><th className="px-6 py-3 font-medium">Seller</th>
                    <th className="px-6 py-3 font-medium">Amount</th><th className="px-6 py-3 font-medium">Status</th><th className="px-6 py-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t) => (
                    <tr key={t.id} className="border-b border-border/60 last:border-0 hover:bg-muted/40">
                      <td className="px-6 py-3 font-mono text-xs">{String(t.id).slice(0, 12)}</td>
                      <td className="px-6 py-3">{t.product}</td>
                      <td className="px-6 py-3 text-muted-foreground">{t.buyer}</td>
                      <td className="px-6 py-3 text-muted-foreground">{t.seller}</td>
                      <td className="px-6 py-3 font-medium">${t.amount}</td>
                      <td className="px-6 py-3"><Badge variant={statusVariant[t.status] ?? 'muted'}>{t.status}</Badge></td>
                      <td className="px-6 py-3 text-muted-foreground">{t.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
