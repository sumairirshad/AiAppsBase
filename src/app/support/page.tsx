import type { Metadata } from 'next'
import { CreditCard, MessageCircle, Shield, ShoppingBag, Upload } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

export const metadata: Metadata = {
  title: 'Support — Help Center',
  description:
    'Find answers to common questions about buying, selling, payments, and account management on AIAppsBase.',
  openGraph: {
    title: 'AIAppsBase Help Center & Support',
    description: 'Find answers to common questions about AIAppsBase marketplace.',
    type: 'website',
  },
}

const categories = [
  {
    slug: 'buying',
    icon: ShoppingBag,
    title: 'Buying Products',
    questions: [
      { q: 'How do I purchase a product?', a: 'Browse the marketplace, click on a product, then click "Buy Now". You will be taken to a secure Stripe checkout page. After payment, you get instant access to download the source code.' },
      { q: 'Can I get a refund?', a: 'Refunds are handled case-by-case. If the product does not match its description or has serious technical issues, contact us within 7 days of purchase at support@aiappsbase.dev.' },
      { q: 'Where do I find my purchases?', a: 'All your purchased products appear in your Buyer Dashboard under "My Purchases". You can download them any time.' },
      { q: 'What do I get when I buy a product?', a: 'You receive the full source code as a ZIP file. What\'s included is detailed in each product listing — always check the product description before buying.' },
    ],
  },
  {
    slug: 'selling',
    icon: Upload,
    title: 'Selling Products',
    questions: [
      { q: 'How do I become a seller?', a: 'Create an account, then navigate to your Panel. You can list your first product from the "Add Product" page. Our team reviews and approves all listings within 1-2 business days.' },
      { q: 'What can I sell on AIAppsBase?', a: 'Anything built primarily with AI tools — website templates, full-stack apps, dashboards, UI component libraries, and mobile apps. The product must include full source code.' },
      { q: 'How do I connect my GitHub repo?', a: 'Go to Panel → GitHub Integration and click "Connect GitHub". Authorize AIAppsBase and select the repo you want to link to a product listing.' },
      { q: 'What is the seller revenue share?', a: 'Sellers keep 80% of every sale. The 20% platform fee covers payment processing, hosting, and marketplace operations.' },
    ],
  },
  {
    slug: 'payments',
    icon: CreditCard,
    title: 'Payments & Billing',
    questions: [
      { q: 'What payment methods are accepted?', a: 'All major credit and debit cards (Visa, Mastercard, American Express) via Stripe. We do not store your card details — Stripe handles all payment data securely.' },
      { q: 'When do sellers get paid?', a: 'Seller payouts are processed on a rolling 14-day basis via Stripe Connect. You need a connected Stripe account to receive payments.' },
      { q: 'Are payments secure?', a: 'Yes. All payments go through Stripe, which is PCI-DSS Level 1 certified — the highest level of payment security certification.' },
    ],
  },
  {
    slug: 'account',
    icon: Shield,
    title: 'Account & Security',
    questions: [
      { q: 'How do I verify my email?', a: 'After registering, we send a 6-digit OTP to your email. Enter it on the verification page. Check your spam folder if you don\'t see it within a minute.' },
      { q: 'I forgot my password. What do I do?', a: 'Use the "Forgot Password" link on the login page. We\'ll email you a reset link valid for 15 minutes.' },
      { q: 'Can I change my account role?', a: 'You can contact support to switch between buyer and seller roles. Admin accounts are not self-assignable.' },
    ],
  },
]

export default function SupportPage() {
  return (
    <div className="relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[-15%] h-96 w-[700px] -translate-x-1/2 rounded-full bg-primary/15 blur-[120px]" />
        <div className="absolute inset-0 bg-grid bg-grid-pattern opacity-30 mask-fade-b" />
      </div>

      <section className="container max-w-3xl py-20 text-center sm:py-24">
        <Badge variant="brand" className="px-3 py-1"><MessageCircle className="size-3" /> Help Center</Badge>
        <h1 className="mt-5 font-display text-4xl font-bold tracking-tight sm:text-5xl">
          How can we help?
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
          Find answers to common questions or reach out directly.
        </p>
      </section>

      <div className="container max-w-3xl space-y-10 pb-16">
        {categories.map(({ slug, icon: Icon, title, questions }) => (
          <section key={slug}>
            <div className="mb-2 flex items-center gap-3">
              <div className="grid size-9 place-items-center rounded-xl border border-primary/20 bg-primary/10">
                <Icon className="size-4 text-primary" />
              </div>
              <h2 className="text-xl font-semibold">{title}</h2>
            </div>
            <Card className="px-5">
              <Accordion type="single" collapsible>
                {questions.map(({ q, a }, i) => (
                  <AccordionItem key={q} value={`${slug}-${i}`} className="last:border-0">
                    <AccordionTrigger>{q}</AccordionTrigger>
                    <AccordionContent>{a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </Card>
          </section>
        ))}

        <Card className="p-8 text-center">
          <MessageCircle className="mx-auto mb-4 size-10 text-primary" />
          <h3 className="mb-2 text-lg font-semibold">Still need help?</h3>
          <p className="mb-6 text-sm text-muted-foreground">
            Can&apos;t find what you&apos;re looking for? Email us and we&apos;ll get back to you within 24 hours.
          </p>
          <Button variant="gradient" asChild>
            <a href="mailto:support@aiappsbase.dev"><MessageCircle className="size-4" /> Email Support</a>
          </Button>
        </Card>
      </div>
    </div>
  )
}
