import type { Metadata } from 'next'
import { InfoPage } from '@/components/layout/info-page'

export const metadata: Metadata = {
  title: 'DMCA policy',
  description: 'How to report copyright infringement and how we handle takedown notices and counter-notices in accordance with the Digital Millennium Copyright Act.',
}

const sections = [
  {
    title: '1. Policy',
    content: `AIAppsBase respects the intellectual property rights of others and expects sellers to do the same. We respond to clear notices of alleged copyright infringement that comply with the Digital Millennium Copyright Act ("DMCA"), 17 U.S.C. § 512.`,
  },
  {
    title: '2. Filing a takedown notice',
    content: `If you believe a listing on AIAppsBase infringes your copyright, send a written notice to dmca@aiappsbase.dev that includes: (a) your physical or electronic signature; (b) identification of the copyrighted work claimed to be infringed; (c) identification of the material you claim is infringing, with enough detail for us to locate it (a product URL is sufficient); (d) your contact information (address, phone number, email); (e) a statement that you have a good-faith belief the use is not authorized by the copyright owner, its agent, or the law; and (f) a statement, under penalty of perjury, that the information in the notice is accurate and that you are authorized to act on behalf of the copyright owner.`,
  },
  {
    title: '3. What happens next',
    content: `Upon receiving a complete notice, we remove or disable access to the reported listing and notify the seller who uploaded it, including a copy of the notice.`,
  },
  {
    title: '4. Counter-notification',
    content: `If you believe your listing was removed in error, you may submit a counter-notice to dmca@aiappsbase.dev containing: your signature; identification of the removed material and its location before removal; a statement under penalty of perjury that you have a good-faith belief the material was removed by mistake or misidentification; and your contact information and consent to the jurisdiction of the federal court in your district (or, if outside the US, any district where AIAppsBase may be found). We forward counter-notices to the original complainant. Unless they file a court action within 10 business days, we may restore the listing.`,
  },
  {
    title: '5. Repeat infringers',
    content: `Sellers who are the subject of repeated, valid takedown notices will have their seller account suspended or banned.`,
  },
  {
    title: '6. Contact',
    content: `DMCA notices and counter-notices: dmca@aiappsbase.dev. This policy does not constitute legal advice; consider consulting an attorney before filing a notice.`,
  },
]

export default function Page() {
  return (
    <InfoPage
      eyebrow="Legal"
      title="DMCA policy"
      description="How to report copyright infringement and how we handle takedown notices and counter-notices in accordance with the Digital Millennium Copyright Act."
      icon="Info"
      actions={[{ label: 'File a notice', href: 'mailto:dmca@aiappsbase.dev', variant: 'gradient' }, { label: 'Contact us', href: '/contact', variant: 'outline' }]}
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
