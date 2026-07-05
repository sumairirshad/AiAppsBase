/**
 * Demo analytics for the seller and buyer dashboards. Derived from the
 * marketplace dataset so numbers feel consistent across the app. Deterministic.
 */
import { products, sellers, CATEGORIES } from '@/lib/marketplace-data'

let s = 424242
const rand = () => {
  s |= 0; s = (s + 0x6d2b79f5) | 0
  let t = Math.imul(s ^ (s >>> 15), 1 | s)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}
const int = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/* The "current seller" — a rich profile used for the seller dashboard. */
export const currentSeller = sellers[0]
export const sellerProducts = products.filter((_, i) => i % 3 === 0).slice(0, 8)

export const sellerRevenueSeries = MONTHS.slice(0, 9).map((m, i) => {
  const base = 3200 + i * 850
  return {
    month: m,
    revenue: base + int(-600, 1400),
    sales: int(40, 140) + i * 6,
  }
})

export const sellerCategorySplit = CATEGORIES.slice(0, 5).map((c, i) => ({
  name: c.name,
  value: [34, 26, 18, 14, 8][i],
}))

export const sellerStats = {
  revenue: sellerRevenueSeries.reduce((a, b) => a + b.revenue, 0),
  sales: sellerRevenueSeries.reduce((a, b) => a + b.sales, 0),
  products: sellerProducts.length,
  followers: currentSeller.followers,
  revenueChange: 12.4,
  salesChange: 8.1,
  productsChange: 4,
  followersChange: 18.6,
  avgRating: 4.8,
  conversion: 3.9,
  payout: 12480,
  pending: 3240,
}

export const sellerTopProducts = sellerProducts.slice(0, 5).map((p) => ({
  id: p.id,
  title: p.title,
  gradient: p.gradient,
  price: p.price,
  sales: int(80, 900),
  revenue: (p.price || 19) * int(80, 900),
  rating: p.rating,
}))

const buyerNames = ['Chris M.', 'Dana K.', 'Sam P.', 'Riley T.', 'Jordan F.', 'Casey L.', 'Morgan R.', 'Avery S.']
export const sellerRecentOrders = sellerProducts.slice(0, 6).map((p, i) => ({
  id: `ORD-${(9204 + i * 7).toString(36).toUpperCase()}`,
  product: p.title,
  gradient: p.gradient,
  buyer: buyerNames[i % buyerNames.length],
  amount: p.price || 19,
  status: (['completed', 'completed', 'completed', 'pending', 'completed', 'refunded'] as const)[i],
  date: `2026-07-0${(i % 6) + 1}`,
}))

/* Buyer dashboard */
export const buyerPurchases = products.filter((_, i) => i % 5 === 1).slice(0, 6).map((p, i) => ({
  id: `ORD-${(5510 + i * 11).toString(36).toUpperCase()}`,
  product: p,
  amount: p.price || 0,
  license: (['Commercial', 'Personal', 'Extended'] as const)[i % 3],
  status: (['completed', 'completed', 'completed', 'completed', 'refunded', 'completed'] as const)[i],
  date: `2026-0${(i % 6) + 2}-1${i}`,
  licenseKey: `AIAB-${(1000 + i * 137).toString(36).toUpperCase()}-${(9000 - i * 91).toString(36).toUpperCase()}`,
}))

export const buyerWishlist = products.filter((_, i) => i % 7 === 3).slice(0, 4)
export const buyerRecommended = products.filter((p) => p.featured).slice(0, 3)

export const buyerSpendSeries = MONTHS.slice(0, 6).map((m) => ({ month: m, spent: int(29, 260) }))

export const buyerStats = {
  purchases: buyerPurchases.length,
  spent: buyerPurchases.reduce((a, b) => a + b.amount, 0),
  downloads: buyerPurchases.filter((o) => o.status === 'completed').length * 2,
  wishlist: buyerWishlist.length,
}
