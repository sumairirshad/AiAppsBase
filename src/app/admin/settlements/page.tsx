import Link from 'next/link'
import { Landmark, Clock, CheckCircle2, XCircle } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatCard } from '@/components/dashboard/stat-card'
import { PageHead } from '@/components/dashboard/page-head'
import { EmptyState } from '@/components/dashboard/empty-state'
import { SettlementRowActions } from '@/components/admin/settlement-row-actions'
import { getSettlements } from '@/lib/dashboard'

export const dynamic = 'force-dynamic'

const statusVariant: Record<string, 'success' | 'warning' | 'destructive'> = {
  pending: 'warning', approved: 'success', rejected: 'destructive', failed: 'destructive',
}

export default async function AdminSettlementsPage({
  searchParams,
}: {
  searchParams: { status?: string }
}) {
  const status = searchParams.status
  const [all, settlements] = await Promise.all([getSettlements(), getSettlements(status)])

  const pending = all.filter((s) => s.status === 'pending')
  const approved = all.filter((s) => s.status === 'approved')
  const rejectedOrFailed = all.filter((s) => s.status === 'rejected' || s.status === 'failed')

  const filters = [
    { label: 'All', value: undefined },
    { label: 'Pending', value: 'pending' },
    { label: 'Approved', value: 'approved' },
    { label: 'Rejected', value: 'rejected' },
    { label: 'Failed', value: 'failed' },
  ]

  return (
    <div className="mx-auto max-w-7xl">
      <PageHead title="Settlements" description="Review and approve seller withdrawal requests." />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Pending requests" value={pending.length} icon={Clock} />
        <StatCard label="Approved (transferred)" value={approved.reduce((a, s) => a + s.netAmount, 0)} prefix="$" icon={CheckCircle2} />
        <StatCard label="Rejected / failed" value={rejectedOrFailed.length} icon={XCircle} />
      </div>

      <div className="mt-6 mb-4 flex flex-wrap gap-2">
        {filters.map((f) => (
          <Link
            key={f.label}
            href={f.value ? `/admin/settlements?status=${f.value}` : '/admin/settlements'}
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
              status === f.value ? 'border-primary/40 bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>Withdrawal requests</CardTitle></CardHeader>
        <CardContent className={settlements.length ? 'p-0' : ''}>
          {settlements.length === 0 ? (
            <EmptyState icon="Wallet" title="No withdrawal requests" description="Seller withdrawal requests will appear here." className="border-0" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-6 py-3 font-medium">Seller</th><th className="px-6 py-3 font-medium">Requested</th>
                    <th className="px-6 py-3 font-medium">Fee</th><th className="px-6 py-3 font-medium">Net</th>
                    <th className="px-6 py-3 font-medium">Status</th><th className="px-6 py-3 font-medium">Date</th>
                    <th className="px-6 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {settlements.map((s) => (
                    <tr key={s.id} className="border-b border-border/60 last:border-0 hover:bg-muted/40">
                      <td className="px-6 py-3">
                        <div className="font-medium">{s.sellerName}</div>
                        <div className="text-xs text-muted-foreground">{s.sellerEmail}</div>
                      </td>
                      <td className="px-6 py-3 font-medium">${s.requestedAmount.toFixed(2)}</td>
                      <td className="px-6 py-3 text-muted-foreground">${s.feeAmount.toFixed(2)}</td>
                      <td className="px-6 py-3">${s.netAmount.toFixed(2)}</td>
                      <td className="px-6 py-3">
                        <Badge variant={statusVariant[s.status] ?? 'muted'}>{s.status}</Badge>
                        {s.rejectionReason && (
                          <p className="mt-1 max-w-[200px] text-xs text-muted-foreground">{s.rejectionReason}</p>
                        )}
                      </td>
                      <td className="px-6 py-3 text-muted-foreground">{s.createdAt}</td>
                      <td className="px-6 py-3">
                        {(s.status === 'pending' || s.status === 'failed') ? (
                          <SettlementRowActions id={s.id} sellerName={s.sellerName} netAmount={s.netAmount} />
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {s.stripeTransferId ? `Transfer ${s.stripeTransferId.slice(0, 14)}…` : '—'}
                          </span>
                        )}
                      </td>
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
