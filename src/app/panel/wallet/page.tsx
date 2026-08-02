import { Wallet, TrendingUp, Clock } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHead } from '@/components/dashboard/page-head'
import { EmptyState } from '@/components/dashboard/empty-state'
import { StripeConnectCard } from '@/components/dashboard/stripe-connect-card'
import { WithdrawPanel } from '@/components/dashboard/withdraw-panel'
import {
  getCurrentUser, getSellerStats, getSellerOrders, getSellerStripeStatus, getSellerWithdrawals,
} from '@/lib/dashboard'
import { getPlatformFeePercent } from '@/lib/payouts'

export const dynamic = 'force-dynamic'

const withdrawalStatusVariant: Record<string, 'success' | 'warning' | 'destructive'> = {
  pending: 'warning', approved: 'success', rejected: 'destructive', failed: 'destructive',
}

export default async function SellerWalletPage() {
  const user = await getCurrentUser()
  const uid = user?.id ?? ''
  const [stats, orders, stripeStatus, withdrawals] = await Promise.all([
    getSellerStats(uid), getSellerOrders(uid, 50), getSellerStripeStatus(uid), getSellerWithdrawals(uid),
  ])
  const earnings = orders.filter((o) => o.status === 'completed')
  const feePercent = getPlatformFeePercent()

  return (
    <div className="mx-auto max-w-5xl">
      <PageHead title="Wallet & payouts" description="Your balance, earnings, and withdrawal history." />

      <div className="mb-6">
        <StripeConnectCard status={stripeStatus} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><Wallet className="size-4" /> Available</div>
            <div className="mt-2 font-display text-3xl font-bold">${stats.payout.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><Clock className="size-4" /> Pending</div>
            <div className="mt-2 font-display text-3xl font-bold">${stats.pending.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><TrendingUp className="size-4" /> Lifetime</div>
            <div className="mt-2 font-display text-3xl font-bold">${stats.revenue.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 flex justify-end">
        <WithdrawPanel available={stats.payout} feePercent={feePercent} canWithdraw={stripeStatus.payoutsEnabled} />
      </div>

      <Card className="mt-6">
        <CardHeader><CardTitle>Earnings</CardTitle></CardHeader>
        <CardContent className={earnings.length ? 'p-0' : ''}>
          {earnings.length === 0 ? (
            <EmptyState icon="Wallet" title="No earnings yet" description="Completed sales will appear here as earnings." className="border-0" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-6 py-3 font-medium">Order</th><th className="px-6 py-3 font-medium">Product</th>
                    <th className="px-6 py-3 font-medium">Buyer</th><th className="px-6 py-3 font-medium">Amount</th><th className="px-6 py-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {earnings.map((o) => (
                    <tr key={o.id} className="border-b border-border/60 last:border-0 hover:bg-muted/40">
                      <td className="px-6 py-3 font-mono text-xs">{String(o.id).slice(0, 12)}</td>
                      <td className="px-6 py-3">{o.product}</td>
                      <td className="px-6 py-3 text-muted-foreground">{o.buyer}</td>
                      <td className="px-6 py-3 font-medium text-success">+${o.amount}</td>
                      <td className="px-6 py-3 text-muted-foreground">{o.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader><CardTitle>Withdrawal history</CardTitle></CardHeader>
        <CardContent className={withdrawals.length ? 'p-0' : ''}>
          {withdrawals.length === 0 ? (
            <EmptyState icon="Wallet" title="No withdrawals yet" description="Requested withdrawals will show up here with their status." className="border-0" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-6 py-3 font-medium">Requested</th><th className="px-6 py-3 font-medium">Fee</th>
                    <th className="px-6 py-3 font-medium">Net</th><th className="px-6 py-3 font-medium">Status</th><th className="px-6 py-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawals.map((w) => (
                    <tr key={w.id} className="border-b border-border/60 last:border-0 hover:bg-muted/40">
                      <td className="px-6 py-3 font-medium">${w.requestedAmount.toFixed(2)}</td>
                      <td className="px-6 py-3 text-muted-foreground">${w.feeAmount.toFixed(2)}</td>
                      <td className="px-6 py-3 text-success">${w.netAmount.toFixed(2)}</td>
                      <td className="px-6 py-3">
                        <Badge variant={withdrawalStatusVariant[w.status] ?? 'muted'}>{w.status}</Badge>
                        {w.rejectionReason && (w.status === 'rejected' || w.status === 'failed') && (
                          <p className="mt-1 text-xs text-muted-foreground">{w.rejectionReason}</p>
                        )}
                      </td>
                      <td className="px-6 py-3 text-muted-foreground">{w.createdAt}</td>
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
