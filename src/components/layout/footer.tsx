import Link from 'next/link'
import { Zap } from 'lucide-react'

import { Icon } from '@/components/icon'
import { Separator } from '@/components/ui/separator'
import { NewsletterForm } from '@/components/landing/newsletter-form'
import { footerColumns, footerLegalBar, socialLinks } from '@/lib/nav-data'

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/20">
      <div className="container py-16">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_2.6fr]">
          {/* Brand + newsletter */}
          <div className="space-y-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-fuchsia-500 shadow-md">
                <Zap className="size-5 text-white" />
              </div>
              <span className="font-display text-lg font-bold">AIAppsBase</span>
            </Link>
            <p className="max-w-sm text-sm text-muted-foreground">
              The marketplace for AI-built projects and GitHub repositories. Buy and sell
              production-ready code — synced, delivered, and protected end to end.
            </p>
            <div className="max-w-sm space-y-2">
              <p className="text-sm font-medium">Get product updates</p>
              <NewsletterForm />
            </div>
            <div className="flex items-center gap-2">
              {socialLinks.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="grid size-9 place-items-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                >
                  <Icon name={s.icon} className="size-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-6">
            {footerColumns.map((col) => (
              <div key={col.title}>
                <h4 className="mb-3 text-sm font-semibold">{col.title}</h4>
                <ul className="space-y-2.5">
                  {col.items.map((item) => (
                    <li key={item.label}>
                      <Link
                        href={item.href}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <Separator className="my-10" />

        <div className="flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground md:flex-row">
          <p>&copy; {new Date().getFullYear()} AIAppsBase, Inc. All rights reserved.</p>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            {footerLegalBar.map((l) => (
              <Link key={l.href} href={l.href} className="transition-colors hover:text-foreground">
                {l.label}
              </Link>
            ))}
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 animate-pulse rounded-full bg-success" />
              All systems operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
