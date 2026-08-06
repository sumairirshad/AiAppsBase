import { PageHead } from '@/components/dashboard/page-head'
import { EmptyState } from '@/components/dashboard/empty-state'
import { SettingsForm } from '@/components/dashboard/settings-form'
import { getCurrentUser, getSellerStripeStatus } from '@/lib/dashboard'

export const dynamic = 'force-dynamic'

export default async function SellerSettingsPage() {
  const user = await getCurrentUser()
  const stripeStatus = user ? await getSellerStripeStatus(user.id) : null

  return (
    <div className="mx-auto max-w-4xl">
      <PageHead title="Settings" description="Manage your profile, security, and account." />
      {user && stripeStatus ? (
        <SettingsForm user={user} stripeStatus={stripeStatus} />
      ) : (
        <EmptyState icon="Info" title="Sign in required" description="Sign in to manage your account settings." actionLabel="Sign in" actionHref="/auth/login" />
      )}
    </div>
  )
}
