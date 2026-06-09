'use client'

import { useState, useMemo, useEffect } from 'react'
import {
  Search, SlidersHorizontal, Grid3X3, List, ChevronDown, X, Star, Loader2,
} from 'lucide-react'
import { ProductCard } from '@/components/products/product-card'
import { aiToolColors } from '@/lib/mock-data'
import type { Product, Category, AITool, TechStack, LicenseType } from '@/types'

const categories: Category[] = [
  'Website Template', 'Landing Page', 'Dashboard', 'E-commerce',
  'SaaS', 'Portfolio', 'Blog', 'Mobile App', 'Component Library', 'Full-Stack App',
]

const aiTools: AITool[] = [
  'ChatGPT', 'Claude', 'v0', 'Bolt', 'Lovable',
  'Cursor', 'Windsurf', 'Replit', 'Copilot',
]

const techStacks: TechStack[] = [
  'React', 'Next.js', 'Vue', 'Svelte', 'HTML/CSS',
  'React Native', 'Flutter', 'Swift', 'Kotlin', 'Tailwind CSS',
]

const licenseTypes: LicenseType[] = ['Personal', 'Commercial', 'Extended Commercial']

const sortOptions = [
  { label: 'Newest', value: 'newest' },
  { label: 'Best Selling', value: 'best-selling' },
  { label: 'Price: Low → High', value: 'price-asc' },
  { label: 'Price: High → Low', value: 'price-desc' },
  { label: 'Top Rated', value: 'top-rated' },
] as const

type SortValue = (typeof sortOptions)[number]['value']

export default function ProductsPage() {
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortValue>('newest')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(true)
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([])
  const [selectedAITools, setSelectedAITools] = useState<AITool[]>([])
  const [selectedTechStack, setSelectedTechStack] = useState<TechStack[]>([])
  const [selectedLicenses, setSelectedLicenses] = useState<LicenseType[]>([])
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 200])
  const [minRating, setMinRating] = useState(0)

  useEffect(() => {
    fetch('/api/marketplace')
      .then((r) => r.json())
      .then((data) => setAllProducts(data.products ?? []))
      .catch(() => setAllProducts([]))
      .finally(() => setLoading(false))
  }, [])

  const toggleFilter = <T,>(arr: T[], item: T, setter: (v: T[]) => void) => {
    setter(arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item])
  }

  const clearAllFilters = () => {
    setSelectedCategories([])
    setSelectedAITools([])
    setSelectedTechStack([])
    setSelectedLicenses([])
    setPriceRange([0, 200])
    setMinRating(0)
    setSearchQuery('')
  }

  const activeFilterCount =
    selectedCategories.length +
    selectedAITools.length +
    selectedTechStack.length +
    selectedLicenses.length +
    (minRating > 0 ? 1 : 0) +
    (priceRange[0] > 0 || priceRange[1] < 200 ? 1 : 0)

  const filteredProducts = useMemo(() => {
    let products = [...allProducts]

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      products = products.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
      )
    }

    if (selectedCategories.length > 0) {
      products = products.filter((p) => selectedCategories.includes(p.category))
    }

    if (selectedAITools.length > 0) {
      products = products.filter((p) =>
        p.aiTools.some((t) => selectedAITools.includes(t))
      )
    }

    if (selectedTechStack.length > 0) {
      products = products.filter((p) =>
        p.techStack.some((t) => selectedTechStack.includes(t))
      )
    }

    if (selectedLicenses.length > 0) {
      products = products.filter((p) => selectedLicenses.includes(p.licenseType))
    }

    products = products.filter(
      (p) => p.price >= priceRange[0] && p.price <= priceRange[1]
    )

    if (minRating > 0) {
      products = products.filter((p) => p.rating >= minRating)
    }

    switch (sortBy) {
      case 'newest':
        products.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        break
      case 'best-selling':
        products.sort((a, b) => b.salesCount - a.salesCount)
        break
      case 'price-asc':
        products.sort((a, b) => a.price - b.price)
        break
      case 'price-desc':
        products.sort((a, b) => b.price - a.price)
        break
      case 'top-rated':
        products.sort((a, b) => b.rating - a.rating)
        break
    }

    return products
  }, [allProducts, searchQuery, sortBy, selectedCategories, selectedAITools, selectedTechStack, selectedLicenses, priceRange, minRating])

  return (
    <div className="min-h-screen bg-surface-950">
      {/* Header / Search */}
      <div className="border-b border-white/10 bg-surface-950/80 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
              <input
                type="text"
                placeholder="Search products, templates, tools..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field pl-10 pr-4"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`btn-secondary flex items-center gap-2 text-sm ${showFilters ? 'border-brand-500/50 text-brand-400' : ''}`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="bg-brand-600 text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              <div className="flex items-center glass rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-brand-600 text-white' : 'text-surface-400 hover:text-white'}`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-brand-600 text-white' : 'text-surface-400 hover:text-white'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortValue)}
                  className="input-field pr-10 text-sm appearance-none cursor-pointer min-w-[180px]"
                >
                  {sortOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          {showFilters && (
            <aside className="w-64 flex-shrink-0 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Filters</h3>
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearAllFilters}
                    className="text-xs text-brand-400 hover:text-brand-300 transition-colors"
                  >
                    Clear all
                  </button>
                )}
              </div>

              <FilterSection title="Category">
                {categories.map((cat) => (
                  <FilterCheckbox
                    key={cat}
                    label={cat}
                    checked={selectedCategories.includes(cat)}
                    onChange={() => toggleFilter(selectedCategories, cat, setSelectedCategories)}
                  />
                ))}
              </FilterSection>

              <FilterSection title="AI Tool">
                {aiTools.map((tool) => (
                  <FilterCheckbox
                    key={tool}
                    label={tool}
                    checked={selectedAITools.includes(tool)}
                    onChange={() => toggleFilter(selectedAITools, tool, setSelectedAITools)}
                    badgeClass={aiToolColors[tool]}
                  />
                ))}
              </FilterSection>

              <FilterSection title="Tech Stack">
                {techStacks.map((tech) => (
                  <FilterCheckbox
                    key={tech}
                    label={tech}
                    checked={selectedTechStack.includes(tech)}
                    onChange={() => toggleFilter(selectedTechStack, tech, setSelectedTechStack)}
                  />
                ))}
              </FilterSection>

              <FilterSection title="Price Range">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="number" min={0} max={priceRange[1]} value={priceRange[0]}
                      onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                      className="input-field text-xs py-1.5 px-2 w-20" placeholder="Min"
                    />
                    <span className="text-surface-500 text-xs">to</span>
                    <input
                      type="number" min={priceRange[0]} value={priceRange[1]}
                      onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                      className="input-field text-xs py-1.5 px-2 w-20" placeholder="Max"
                    />
                  </div>
                  <input
                    type="range" min={0} max={200} value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                    className="w-full accent-brand-500"
                  />
                  <div className="flex justify-between text-[10px] text-surface-500">
                    <span>$0</span><span>$200+</span>
                  </div>
                </div>
              </FilterSection>

              <FilterSection title="Minimum Rating">
                <div className="space-y-1.5">
                  {[4, 3, 2, 1].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => setMinRating(minRating === rating ? 0 : rating)}
                      className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-xs transition-colors ${
                        minRating === rating
                          ? 'bg-brand-600/20 text-brand-400'
                          : 'text-surface-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`w-3 h-3 ${i < rating ? 'text-amber-400 fill-amber-400' : 'text-surface-600'}`} />
                        ))}
                      </div>
                      <span>& up</span>
                    </button>
                  ))}
                </div>
              </FilterSection>

              <FilterSection title="License Type">
                {licenseTypes.map((license) => (
                  <FilterCheckbox
                    key={license}
                    label={license}
                    checked={selectedLicenses.includes(license)}
                    onChange={() => toggleFilter(selectedLicenses, license, setSelectedLicenses)}
                  />
                ))}
              </FilterSection>
            </aside>
          )}

          <main className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-surface-400">
                {loading
                  ? <span className="flex items-center gap-2"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading...</span>
                  : <><span className="text-white font-medium">{filteredProducts.length}</span> products found</>
                }
              </p>
              {activeFilterCount > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1"
                >
                  <X className="w-3 h-3" /> Clear filters
                </button>
              )}
            </div>

            {!loading && filteredProducts.length === 0 ? (
              <div className="glass rounded-xl p-12 text-center">
                <Search className="w-12 h-12 text-surface-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No products found</h3>
                <p className="text-surface-400 text-sm mb-4">
                  Try adjusting your search or filters.
                </p>
                <button onClick={clearAllFilters} className="btn-primary text-sm">
                  Clear all filters
                </button>
              </div>
            ) : (
              <div
                className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
                    : 'flex flex-col gap-4'
                }
              >
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass rounded-xl p-4 space-y-3">
      <h4 className="text-xs font-semibold text-surface-300 uppercase tracking-wider">{title}</h4>
      <div className="space-y-1">{children}</div>
    </div>
  )
}

function FilterCheckbox({
  label, checked, onChange, badgeClass,
}: {
  label: string; checked: boolean; onChange: () => void; badgeClass?: string
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer group px-1 py-1 rounded-md hover:bg-white/5 transition-colors">
      <input
        type="checkbox" checked={checked} onChange={onChange}
        className="w-3.5 h-3.5 rounded border-surface-600 bg-surface-800 text-brand-500 focus:ring-brand-500 focus:ring-offset-0 accent-brand-500"
      />
      {badgeClass ? (
        <span className={`badge border text-[10px] ${badgeClass}`}>{label}</span>
      ) : (
        <span className="text-xs text-surface-400 group-hover:text-white transition-colors">{label}</span>
      )}
    </label>
  )
}
