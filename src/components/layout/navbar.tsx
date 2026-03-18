'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, ShoppingCart, Menu, X, User, Zap } from 'lucide-react'

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <nav className="sticky top-0 z-50 glass border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-purple-500 rounded-lg flex items-center justify-center group-hover:shadow-lg group-hover:shadow-brand-500/25 transition-all">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">AIForge</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/products" className="text-surface-300 hover:text-white transition-colors text-sm">
              Browse
            </Link>
            <Link href="/products?category=Website+Template" className="text-surface-300 hover:text-white transition-colors text-sm">
              Templates
            </Link>
            <Link href="/products?category=Full-Stack+App" className="text-surface-300 hover:text-white transition-colors text-sm">
              Apps
            </Link>
            <Link href="/products?category=Component+Library" className="text-surface-300 hover:text-white transition-colors text-sm">
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
            <Link href="/seller" className="text-surface-300 hover:text-white transition-colors text-sm">
              Sell
            </Link>
            <Link href="/buyer" className="relative p-2 text-surface-300 hover:text-white transition-colors">
              <ShoppingCart className="w-5 h-5" />
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-brand-500 rounded-full text-[10px] flex items-center justify-center font-bold">
                2
              </span>
            </Link>
            <Link href="/auth/login" className="btn-secondary text-sm py-2 px-4">
              Sign In
            </Link>
            <Link href="/auth/register" className="btn-primary text-sm py-2 px-4">
              Sign Up
            </Link>
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
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
              <input
                type="text"
                placeholder="Search..."
                className="input-field pl-10 text-sm"
              />
            </div>
            <Link href="/products" className="block py-2 text-surface-300 hover:text-white">Browse</Link>
            <Link href="/seller" className="block py-2 text-surface-300 hover:text-white">Sell</Link>
            <Link href="/buyer" className="block py-2 text-surface-300 hover:text-white">My Purchases</Link>
            <Link href="/auth/login" className="block py-2 text-surface-300 hover:text-white">Sign In</Link>
            <Link href="/auth/register" className="block btn-primary text-center text-sm">Sign Up</Link>
          </div>
        </div>
      )}
    </nav>
  )
}
