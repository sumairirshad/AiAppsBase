import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

import { JsonLd } from '@/components/seo/json-ld'
import { breadcrumbSchema, type BreadcrumbEntry } from '@/lib/seo'

/** Visual breadcrumb trail + matching BreadcrumbList JSON-LD. `items` should start with Home. */
export function Breadcrumbs({ items, className }: { items: BreadcrumbEntry[]; className?: string }) {
  return (
    <>
      <JsonLd data={breadcrumbSchema(items)} />
      <nav aria-label="Breadcrumb" className={className ?? 'mb-6 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground'}>
        {items.map((item, i) => {
          const isLast = i === items.length - 1
          return (
            <span key={item.href} className="inline-flex items-center gap-1.5">
              {isLast ? (
                <span aria-current="page" className="truncate text-foreground">{item.label}</span>
              ) : (
                <Link href={item.href} className="hover:text-foreground">{item.label}</Link>
              )}
              {!isLast && <ChevronRight className="size-3.5" />}
            </span>
          )
        })}
      </nav>
    </>
  )
}
