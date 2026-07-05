import Link from 'next/link'
import { Zap, Check, Star, ShieldCheck } from 'lucide-react'

const bullets = [
  'Buy & sell production-ready GitHub projects',
  'Instant, secure delivery with buyer protection',
  'Escrow-backed payouts for creators',
]

export function AuthShell({
  title, subtitle, children, footer,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
  footer?: React.ReactNode
}) {
  return (
    <div className="grid min-h-[calc(100vh-4rem)] lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-grid bg-grid-pattern opacity-20" />
          <div className="absolute -left-16 top-10 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -right-10 bottom-0 h-80 w-80 rounded-full bg-black/10 blur-3xl" />
        </div>

        <Link href="/" className="relative flex items-center gap-2 text-white">
          <div className="grid size-9 place-items-center rounded-xl bg-white/15 backdrop-blur">
            <Zap className="size-5" />
          </div>
          <span className="font-display text-lg font-bold">AIAppsBase</span>
        </Link>

        <div className="relative space-y-8 text-white">
          <h2 className="max-w-md font-display text-3xl font-bold leading-tight">
            The marketplace for AI-built projects &amp; repos.
          </h2>
          <ul className="space-y-3">
            {bullets.map((b) => (
              <li key={b} className="flex items-center gap-3 text-white/90">
                <span className="grid size-5 shrink-0 place-items-center rounded-full bg-white/20">
                  <Check className="size-3.5" />
                </span>
                {b}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative grid grid-cols-3 gap-3 text-white">
          {[
            { label: 'Instant delivery', icon: Check },
            { label: 'Buyer protection', icon: ShieldCheck },
            { label: 'Fast payouts', icon: Star },
          ].map((f) => (
            <div key={f.label} className="rounded-xl border border-white/15 bg-white/10 p-4 backdrop-blur">
              <f.icon className="mb-2 size-5" />
              <p className="text-xs font-medium text-white/90">{f.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Form panel */}
      <div className="relative flex items-center justify-center px-4 py-12">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 lg:hidden">
          <div className="absolute left-1/2 top-1/4 h-72 w-[500px] -translate-x-1/2 rounded-full bg-primary/15 blur-[100px]" />
        </div>
        <div className="w-full max-w-md">
          <Link href="/" className="mb-8 flex items-center justify-center gap-2 lg:hidden">
            <div className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500">
              <Zap className="size-5 text-white" />
            </div>
            <span className="font-display text-lg font-bold">AIAppsBase</span>
          </Link>

          <div className="mb-8 text-center lg:text-left">
            <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
          </div>

          {children}

          {footer && <div className="mt-6 text-center text-sm text-muted-foreground lg:text-left">{footer}</div>}
        </div>
      </div>
    </div>
  )
}
