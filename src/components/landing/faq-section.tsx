'use client'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { faqs } from '@/lib/landing-data'

export function FaqSection() {
  return (
    <Accordion type="single" collapsible className="w-full">
      {faqs.map((faq, i) => (
        <AccordionItem key={i} value={`item-${i}`}>
          <AccordionTrigger>{faq.q}</AccordionTrigger>
          <AccordionContent>{faq.a}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
