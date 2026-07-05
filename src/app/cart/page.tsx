import { CartView } from '@/components/cart/cart-view'
import { getCart } from '@/lib/cart'
import { getCurrentUser } from '@/lib/dashboard'

export default async function CartPage() {
  const user = await getCurrentUser()

  if (!user) {
    return <CartView items={[]} authed={false} />
  }

  const cart = await getCart(user.id)

  return (
    <CartView
      items={cart?.items ?? []}
      authed={true}
    />
  )
}