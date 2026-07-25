import { isAdminGuardError, requireAdmin } from '@/lib/admin'
import { getOrdersForExport } from '@/lib/admin-data'

function csvEscape(value: unknown): string {
  const s = String(value ?? '')
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export async function GET() {
  const guard = await requireAdmin()
  if (isAdminGuardError(guard)) return guard

  const orders = await getOrdersForExport()
  const header = ['Order ID', 'Product', 'Buyer', 'Buyer Email', 'Provider', 'Provider Email', 'Amount', 'Status', 'License', 'Date']
  const rows = orders.map((o) => [
    o.id, o.product, o.buyer, o.buyer_email, o.seller, o.seller_email,
    o.amount.toFixed(2), o.status, o.license_type, new Date(o.created_at).toISOString(),
  ])
  const csv = [header, ...rows].map((row) => row.map(csvEscape).join(',')).join('\n')

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="bookings-export-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
