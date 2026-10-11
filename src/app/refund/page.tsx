import type { Metadata } from 'next'
import { InfoPage } from '@/components/layout/info-page'

export const metadata: Metadata = {
  title: 'Refund policy',
  description: 'Purchases are covered by a 14-day buyer-protection window. If a product is materially misrepresented or broken, you can request a refund and our team will mediate.',
}

const sections = [
  {
    title: '1. The 14-day buyer-protection window',
    content: `You have 14 days from the date of purchase to report a problem with a product. After that window, purchases are final and cannot be refunded except at our discretion.`,
  },
  {
    title: '2. What qualifies',
    content: `A refund is appropriate when a product is materially misrepresented (it doesn't do what the listing describes), is broken or non-functional as delivered, or the deliverable/repository access was never provided. Refunds are not given for a change of mind, for issues caused by modifications you made after purchase, or because you lack the skills to use the product as delivered.`,
  },
  {
    title: '3. How to request one',
    content: `Open the order from Orders & invoices in your buyer dashboard and use "Report an issue" to describe the problem. This flags the order as disputed and notifies our team — the seller is not able to see your dispute reason change anything about your access in the meantime.`,
  },
  {
    title: '4. How it’s resolved',
    content: `An admin reviews the dispute and either upholds it — in which case we issue a real refund to your original payment method through Stripe and the order is marked refunded — or rejects it, in which case the order is restored to completed and nothing is charged or refunded. We aim to resolve disputes within a few business days.`,
  },
  {
    title: '5. Effect on the seller',
    content: `When a refund is issued, the sale stops counting toward the seller's available balance going forward. If the seller already withdrew earnings that included a since-refunded sale, the shortfall is deducted from their future available balance rather than clawed back directly.`,
  },
]

export default function Page() {
  return (
    <InfoPage
      eyebrow="Legal"
      title="Refund policy"
      description="Purchases are covered by a 14-day buyer-protection window. If a product is materially misrepresented or broken, you can request a refund and our team will mediate."
      icon="LifeBuoy"
      actions={[{ label: 'Request a refund', href: '/buyer/orders', variant: 'gradient' }, { label: 'Read terms', href: '/terms', variant: 'outline' }]}
    >
      <div className="space-y-8">
        {sections.map(({ title, content }) => (
          <section key={title}>
            <h2 className="mb-3 text-base font-semibold">{title}</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">{content}</p>
          </section>
        ))}
      </div>
    </InfoPage>
  )
}
