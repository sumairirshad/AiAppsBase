import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { escapeLike, searchTerms } from '@/lib/search'

const LIMIT = 6

/** Live results for the header search box: approved products matching every word of `q`. */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') || ''
  const terms = searchTerms(q)
  if (terms.length === 0) return NextResponse.json({ results: [] })

  const params: unknown[] = []
  const conditions = terms.map((term) => {
    params.push(`%${escapeLike(term)}%`)
    const n = `$${params.length}`
    return `(p.title ILIKE ${n} OR p.description ILIKE ${n} OR p.category ILIKE ${n}
      OR COALESCE(p.subcategory, '') ILIKE ${n} OR COALESCE(p.github_repo_name, '') ILIKE ${n}
      OR COALESCE(p.language, '') ILIKE ${n}
      OR array_to_string(p.tags, ' ') ILIKE ${n} OR array_to_string(p.tech_stack, ' ') ILIKE ${n})`
  })

  params.push(`%${escapeLike(q.trim().slice(0, 100))}%`)
  const titleParam = `$${params.length}`
  params.push(LIMIT)

  try {
    const res = await query(
      `SELECT p.id, p.title, p.category, p.price, p.language
       FROM products p
       WHERE p.status = 'approved' AND ${conditions.join(' AND ')}
       ORDER BY (p.title ILIKE ${titleParam}) DESC, p.featured DESC, p.stars DESC, p.created_at DESC
       LIMIT $${params.length}`,
      params
    )
    return NextResponse.json({
      results: res.rows.map((r: any) => ({
        id: r.id,
        title: r.title,
        category: r.category,
        price: Number(r.price) || 0,
        language: r.language || '',
      })),
    })
  } catch (err) {
    console.error('search failed:', (err as Error).message)
    return NextResponse.json({ error: 'Search is unavailable right now' }, { status: 500 })
  }
}
