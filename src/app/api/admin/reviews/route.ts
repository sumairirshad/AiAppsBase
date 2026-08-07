import { NextRequest, NextResponse } from 'next/server'
import { isAdminGuardError, requireAdmin } from '@/lib/admin'
import { listAdminReviews } from '@/lib/admin-data'

export async function GET(req: NextRequest) {
  const guard = await requireAdmin()
  if (isAdminGuardError(guard)) return guard

  const { searchParams } = new URL(req.url)
  const ratingParam = searchParams.get('rating')
  const { reviews, total } = await listAdminReviews({
    search: searchParams.get('search') || undefined,
    rating: ratingParam ? Number(ratingParam) : undefined,
    page: Number(searchParams.get('page')) || 1,
    pageSize: Number(searchParams.get('pageSize')) || 20,
  })

  return NextResponse.json({ reviews, total })
}
