import { NextRequest, NextResponse } from 'next/server'
import { searchRankedProducts } from '@/lib/ranking/service'

const LIMIT = 6

/**
 * Live results for the header search box. Ranked by the shared ranking
 * engine (relevance first, then quality, seller reputation, popularity,
 * freshness and exploration, with seller diversity) over the full catalog
 * before taking the top results.
 */
export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get('q') || '').slice(0, 200)
  if (!q.trim()) return NextResponse.json({ results: [] })

  try {
    const ranked = await searchRankedProducts(q, LIMIT)
    return NextResponse.json({
      results: ranked.map(({ product: p }) => ({
        id: p.id,
        title: p.title,
        category: p.category,
        price: p.price,
        language: p.language,
      })),
    })
  } catch (err) {
    console.error('search failed:', (err as Error).message)
    return NextResponse.json({ error: 'Search is unavailable right now' }, { status: 500 })
  }
}
