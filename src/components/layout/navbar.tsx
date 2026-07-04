'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, ShoppingCart, Menu, X, User, Zap, LogOut, LayoutDashboard } from 'lucide-react'

export function Navbar() {
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [user, setUser] = useState<{ full_name: string; email: string; role: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    
    // Fetch profile if token or cookie exists
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user)
        } else if (!token) {
          setUser(null)
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const handleLogout = async () => {
    localStorage.removeItem('auth_token')
    await fetch('/api/auth/me', { method: 'DELETE' })
    setUser(null)
    router.push('/')
    window.location.reload()
  }

  return (
    <nav className="sticky top-0 z-50 glass border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-purple-500 rounded-lg flex items-center justify-center group-hover:shadow-lg group-hover:shadow-brand-500/25 transition-all">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">AIAppsBase</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/products" className="text-surface-300 hover:text-white transition-colors text-sm">
              Browse
            </Link>
            <Link href="/templates" className="text-surface-300 hover:text-white transition-colors text-sm">
              Templates
            </Link>
            <Link href="/apps" className="text-surface-300 hover:text-white transition-colors text-sm">
              Apps
            </Link>
            <Link href="/components" className="text-surface-300 hover:text-white transition-colors text-sm">
              Components
            </Link>
          </div>

          {/* Search */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-6">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
              <input
                type="text"
                placeholder="Search AI-built products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-surface-800/50 border border-surface-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/buyer" className="relative p-2 text-surface-300 hover:text-white transition-colors">
              <ShoppingCart className="w-5 h-5" />
            </Link>

            {!loading && (
              <>
                {user ? (
                  <div className="flex items-center gap-4">
                    <Link
                      href={user.role === 'admin' ? '/admin' : user.role === 'seller' ? '/panel' : '/buyer'}
                      className="flex items-center gap-2 group"
                    >
                      <div className="w-8 h-8 rounded-full bg-brand-500/10 flex items-center justify-center border border-brand-500/20 group-hover:bg-brand-500/20 transition-colors">
                        <User className="w-4 h-4 text-brand-400" />
                      </div>
                      <span className="text-sm font-medium text-surface-200 group-hover:text-white transition-colors">
                        {user.full_name.split(' ')[0]}
                      </span>
                    </Link>
                    <button 
                      onClick={handleLogout}
                      className="p-2 text-surface-400 hover:text-red-400 transition-colors"
                      title="Logout"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Link href="/auth/login" className="btn-secondary text-sm py-2 px-4">
                      Sign In
                    </Link>
                    <Link href="/auth/register" className="btn-primary text-sm py-2 px-4">
                      Sign Up
                    </Link>
                  </>
                )}
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-2 text-surface-300"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden glass border-t border-white/10 animate-fade-in">
          <div className="px-4 py-4 space-y-3">
            {user && (
              <div className="pb-3 border-b border-white/5 mb-3">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-brand-500/10 flex items-center justify-center border border-brand-500/20">
                    <User className="w-5 h-5 text-brand-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{user.full_name}</p>
                    <p className="text-xs text-surface-500">{user.email}</p>
                  </div>
                </div>
                <Link
                  href={user.role === 'admin' ? '/admin' : user.role === 'seller' ? '/panel' : '/buyer'}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 py-2 text-surface-300 hover:text-white"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>
              </div>
            )}
            
            <Link href="/products" className="block py-2 text-surface-300 hover:text-white" onClick={() => setMobileOpen(false)}>Browse</Link>
            <Link href="/templates" className="block py-2 text-surface-300 hover:text-white" onClick={() => setMobileOpen(false)}>Templates</Link>
            <Link href="/apps" className="block py-2 text-surface-300 hover:text-white" onClick={() => setMobileOpen(false)}>Apps</Link>
            <Link href="/components" className="block py-2 text-surface-300 hover:text-white" onClick={() => setMobileOpen(false)}>Components</Link>
            <Link href="/buyer" className="block py-2 text-surface-300 hover:text-white" onClick={() => setMobileOpen(false)}>My Purchases</Link>
            
            {user ? (
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-2 py-2 text-red-400 hover:text-red-300"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            ) : (
              <>
                <Link href="/auth/login" className="block py-2 text-surface-300 hover:text-white">Sign In</Link>
                <Link href="/auth/register" className="block btn-primary text-center text-sm">Sign Up</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
