import type { Metadata } from 'next'
import { InfoPage } from '@/components/layout/info-page'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Read the AIAppsBase Terms of Service — rules for using the marketplace, buying products, selling products, and account obligations.',
  robots: { index: true, follow: true },
}

const sections = [
  {
    title: '1. Acceptance of Terms',
    content: `By accessing or using AIAppsBase ("the Platform"), you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any part of these terms, you may not access the Platform. These Terms apply to all visitors, users, buyers, and sellers.`,
  },
  {
    title: '2. Description of Service',
    content: `AIAppsBase is a digital marketplace that connects creators ("Sellers") of AI-built websites, applications, and UI components with individuals and businesses ("Buyers") who wish to purchase such products. We facilitate the transaction and provide the infrastructure; we do not create, own, or warrant the products listed by Sellers.`,
  },
  {
    title: '3. Account Registration',
    content: `You must create an account to buy or sell on AIAppsBase. You agree to provide accurate, current, and complete information and to keep it updated. You are responsible for maintaining the confidentiality of your password and for all activity under your account. Notify us immediately at support@aiappsbase.dev if you suspect unauthorized use.`,
  },
  {
    title: '4. Buyer Terms',
    content: `When you purchase a product on AIAppsBase, you receive a non-exclusive, non-transferable license to use the source code as specified in the product's listed license type (Personal, Commercial, or Extended Commercial). You may not resell, redistribute, or sublicense purchased products without explicit permission from the Seller. Every purchase is covered by our 14-day buyer-protection window: funds are held in escrow for 14 days after a completed order, during which you may open a dispute if a product is materially misrepresented or broken, and our team will mediate. See our Refund Policy for the full process.`,
  },
  {
    title: '5. Seller Terms',
    content: `To list products on AIAppsBase you must be at least 18 years old and own or have the right to sell the listed content. You grant AIAppsBase a non-exclusive license to display and market your product on the Platform. AIAppsBase retains a platform fee on each sale as published on our Pricing page at the time of the transaction (currently 5-10% depending on your plan); we'll never change your fee without notice. You are solely responsible for the accuracy of product descriptions and the legality of your content, including that you own or are authorized to sell everything in a listing — this includes not listing another party's open-source or proprietary project as your own work. Listing products that infringe third-party intellectual property rights will result in immediate removal and account suspension.`,
  },
  {
    title: '6. Prohibited Conduct',
    content: `You may not: (a) upload malicious code or malware; (b) infringe any intellectual property rights; (c) use the Platform to harass, harm, or discriminate against others; (d) attempt to circumvent payment processing or seller payouts; (e) create fake accounts or manipulate reviews; (f) scrape or harvest data from the Platform without authorization; (g) reverse-engineer the AIAppsBase platform itself.`,
  },
  {
    title: '7. Payments',
    content: `All payments are processed by Stripe. By making a purchase or receiving payouts, you agree to Stripe's Terms of Service. AIAppsBase does not store payment card information. Seller payouts are subject to a 14-day rolling hold. We reserve the right to withhold payouts pending investigation of disputes or policy violations.`,
  },
  {
    title: '8. Intellectual Property',
    content: `The AIAppsBase name, logo, and platform design are the exclusive property of AIAppsBase. Sellers retain ownership of their listed products. By listing a product, Sellers grant AIAppsBase a license to display and promote the product. Buyers receive a limited license per the purchased license tier — no ownership transfer occurs.`,
  },
  {
    title: '9. Disclaimer of Warranties',
    content: `The Platform and all products are provided "as is" without warranty of any kind. AIAppsBase makes no warranties that products will be error-free, fit for a particular purpose, or meet your specific requirements. We do not warrant the accuracy or completeness of product listings.`,
  },
  {
    title: '10. Limitation of Liability',
    content: `To the maximum extent permitted by law, AIAppsBase and its affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or goodwill, arising out of your use of the Platform or any products purchased therein, even if advised of the possibility of such damages.`,
  },
  {
    title: '11. Termination',
    content: `We reserve the right to suspend or terminate your account at any time for breach of these Terms, fraudulent activity, or any conduct we deem harmful to the Platform or its users. Buyers retain access to previously purchased downloads. Seller listings will be removed and pending payouts held pending review.`,
  },
  {
    title: '12. Changes to Terms',
    content: `We may update these Terms at any time. We will notify registered users by email for material changes. Continued use of the Platform after changes constitutes acceptance of the new Terms. The "Last Updated" date at the bottom of this page indicates when these Terms were last revised.`,
  },
  {
    title: '13. Governing Law',
    content: `These Terms are governed by and construed in accordance with the laws of the State of Delaware, United States, without regard to its conflict-of-law provisions. Any disputes arising from these Terms or your use of the Platform shall be subject to binding arbitration in Delaware, except where prohibited by law.`,
  },
  {
    title: '14. Contact',
    content: `For questions about these Terms, contact us at: legal@aiappsbase.dev`,
  },
]

export default function TermsPage() {
  return (
    <InfoPage
      eyebrow="Legal"
      title="Terms of Service"
      description="Last updated: October 9, 2026"
      icon="BookOpen"
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
