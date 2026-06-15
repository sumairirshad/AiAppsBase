import Link from 'next/link'
import { Zap } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-surface-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-purple-500 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold gradient-text">AIForge</span>
            </Link>
            <p className="text-surface-400 text-sm">
              The marketplace for AI-built websites, apps, and components.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-3 text-sm">Marketplace</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/products" className="text-surface-400 hover:text-white transition-colors">Browse All</Link></li>
              <li><Link href="/templates" className="text-surface-400 hover:text-white transition-colors">Templates</Link></li>
              <li><Link href="/apps" className="text-surface-400 hover:text-white transition-colors">Apps</Link></li>
              <li><Link href="/components" className="text-surface-400 hover:text-white transition-colors">Components</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-3 text-sm">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about" className="text-surface-400 hover:text-white transition-colors">About</Link></li>
              <li><Link href="/blog" className="text-surface-400 hover:text-white transition-colors">Blog</Link></li>
              <li><Link href="/support" className="text-surface-400 hover:text-white transition-colors">Support</Link></li>
              <li><Link href="/terms" className="text-surface-400 hover:text-white transition-colors">Terms</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-surface-500 text-sm">&copy; 2025 AIForge. All rights reserved.</p>
          <div className="flex items-center gap-4 text-surface-500 text-sm">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            <Link href="/cookies" className="hover:text-white transition-colors">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
