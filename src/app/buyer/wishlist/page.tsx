import { PageHead } from '@/components/dashboard/page-head'
import { WishlistGrid } from '@/components/dashboard/wishlist-grid'
import { getCurrentUser, getBuyerWishlist } from '@/lib/dashboard'

export const dynamic = 'force-dynamic'

export default async function WishlistPage() {
  const user = await getCurrentUser()
  const items = await getBuyerWishlist(user?.id ?? '')

  return (
    <div className="mx-auto max-w-6xl">
      <PageHead
        title="My wishlist"
        description={`${items.length} saved project${items.length === 1 ? '' : 's'}`}
      />
      <WishlistGrid items={items} />
    </div>
  )
}
