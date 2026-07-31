import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { JsonLd } from '@/components/seo/json-ld'
import { faqSchema, type FaqEntry } from '@/lib/seo'

/** Accordion FAQ block that also emits FAQPage JSON-LD for the same content. */
export function Faq({ items, className }: { items: FaqEntry[]; className?: string }) {
  if (items.length === 0) return null
  return (
    <div className={className}>
      <JsonLd data={faqSchema(items)} />
      <Accordion type="single" collapsible className="w-full">
        {items.map((item, i) => (
          <AccordionItem key={i} value={`faq-${i}`}>
            <AccordionTrigger>{item.q}</AccordionTrigger>
            <AccordionContent>{item.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}
