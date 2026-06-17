import type { Metadata } from 'next'
import Link from 'next/link'
import { MessageCircle, ShoppingBag, Upload, CreditCard, Shield, ChevronRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Support — Help Center | AIForge',
  description:
    'Find answers to common questions about buying, selling, payments, and account management on AIForge.',
  openGraph: {
    title: 'AIForge Help Center & Support',
    description: 'Find answers to common questions about AIForge marketplace.',
    type: 'website',
  },
}

const categories = [
  {
    icon: ShoppingBag,
    title: 'Buying Products',
    color: 'text-brand-400 bg-brand-500/10 border-brand-500/20',
    questions: [
      { q: 'How do I purchase a product?', a: 'Browse the marketplace, click on a product, then click "Buy Now". You will be taken to a secure Stripe checkout page. After payment, you get instant access to download the source code.' },
      { q: 'Can I get a refund?', a: 'Refunds are handled case-by-case. If the product does not match its description or has serious technical issues, contact us within 7 days of purchase at support@aiforge.dev.' },
      { q: 'Where do I find my purchases?', a: 'All your purchased products appear in your Buyer Dashboard under "My Purchases". You can download them any time.' },
      { q: 'What do I get when I buy a product?', a: 'You receive the full source code as a ZIP file. What\'s included is detailed in each product listing — always check the product description before buying.' },
    ],
  },
  {
    icon: Upload,
    title: 'Selling Products',
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    questions: [
      { q: 'How do I become a seller?', a: 'Create an account, then navigate to your Panel. You can list your first product from the "Add Product" page. Our team reviews and approves all listings within 1-2 business days.' },
      { q: 'What can I sell on AIForge?', a: 'Anything built primarily with AI tools — website templates, full-stack apps, dashboards, UI component libraries, and mobile apps. The product must include full source code.' },
      { q: 'How do I connect my GitHub repo?', a: 'Go to Panel → GitHub Integration and click "Connect GitHub". Authorize AIForge and select the repo you want to link to a product listing.' },
      { q: 'What is the seller revenue share?', a: 'Sellers keep 80% of every sale. The 20% platform fee covers payment processing, hosting, and marketplace operations.' },
    ],
  },
  {
    icon: CreditCard,
    title: 'Payments & Billing',
    color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    questions: [
      { q: 'What payment methods are accepted?', a: 'All major credit and debit cards (Visa, Mastercard, American Express) via Stripe. We do not store your card details — Stripe handles all payment data securely.' },
      { q: 'When do sellers get paid?', a: 'Seller payouts are processed on a rolling 14-day basis via Stripe Connect. You need a connected Stripe account to receive payments.' },
      { q: 'Are payments secure?', a: 'Yes. All payments go through Stripe, which is PCI-DSS Level 1 certified — the highest level of payment security certification.' },
    ],
  },
  {
    icon: Shield,
    title: 'Account & Security',
    color: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    questions: [
      { q: 'How do I verify my email?', a: 'After registering, we send a 6-digit OTP to your email. Enter it on the verification page. Check your spam folder if you don\'t see it within a minute.' },
      { q: 'I forgot my password. What do I do?', a: 'Use the "Forgot Password" link on the login page. We\'ll email you a reset link valid for 15 minutes.' },
      { q: 'Can I change my account role?', a: 'You can contact support to switch between buyer and seller roles. Admin accounts are not self-assignable.' },
    ],
  },
]

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-surface-950">
      {/* Header */}
      <section className="border-b border-white/10 py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-950/40 via-surface-950 to-surface-950" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mx-auto mb-6">
            <MessageCircle className="w-7 h-7 text-brand-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Help <span className="gradient-text">Center</span>
          </h1>
          <p className="text-surface-400 text-lg">
            Find answers to common questions or reach out directly.
          </p>
        </div>
      </section>

      {/* FAQ sections */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
        {categories.map(({ icon: Icon, title, color, questions }) => (
          <section key={title}>
            <div className="flex items-center gap-3 mb-6">
              <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <h2 className="text-xl font-semibold text-white">{title}</h2>
            </div>
            <div className="space-y-3">
              {questions.map(({ q, a }) => (
                <details
                  key={q}
                  className="glass rounded-xl border border-white/5 group open:border-brand-500/20 transition-colors"
                >
                  <summary className="flex items-center justify-between px-5 py-4 cursor-pointer list-none select-none">
                    <span className="text-white text-sm font-medium">{q}</span>
                    <ChevronRight className="w-4 h-4 text-surface-400 group-open:rotate-90 transition-transform flex-shrink-0 ml-4" />
                  </summary>
                  <div className="px-5 pb-4">
                    <p className="text-surface-400 text-sm leading-relaxed">{a}</p>
                  </div>
                </details>
              ))}
            </div>
          </section>
        ))}

        {/* Contact */}
        <div className="glass rounded-2xl p-8 border border-white/5 text-center">
          <MessageCircle className="w-10 h-10 text-brand-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Still need help?</h3>
          <p className="text-surface-400 text-sm mb-6">
            Can't find what you're looking for? Email us and we'll get back to you within 24 hours.
          </p>
          <a
            href="mailto:support@aiforge.dev"
            className="btn-primary inline-flex items-center gap-2"
          >
            <MessageCircle className="w-4 h-4" />
            Email Support
          </a>
        </div>
      </div>
    </div>
  )
}
