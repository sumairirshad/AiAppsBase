import { NextRequest, NextResponse } from 'next/server'
import { isAdminGuardError, requireAdmin } from '@/lib/admin'
import { getDiscoveryRanking, searchRankedProducts } from '@/lib/ranking/service'

/**
 * Ranking debugger: why did each product rank where it did?
 *   /api/ranking/explain            → /products discovery order
 *   /api/ranking/explain?q=chatbot  → search order for a query
 * Optional &limit= (default 24, max 200). Admins only in production.
 */
export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    const guard = await requireAdmin()
    if (isAdminGuardError(guard)) return guard
  }

  const q = (req.nextUrl.searchParams.get('q') || '').slice(0, 200)
  const limit = Math.min(200, Math.max(1, Number(req.nextUrl.searchParams.get('limit')) || 24))

  try {
    const ranked = q.trim() ? await searchRankedProducts(q, limit) : (await getDiscoveryRanking()).slice(0, limit)
    return NextResponse.json({
      mode: q.trim() ? 'search' : 'discovery',
      query: q || null,
      results: ranked.map(({ product: p, explain }, i) => ({
        position: i + 1,
        id: p.id,
        title: p.title,
        sellerId: p.sellerId,
        ...explain,
      })),
    })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
