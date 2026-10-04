import { describe, expect, it } from 'vitest'

import {
  buildSearchIndex, computeComponents, rankDiscovery, rankSearch,
  type ProductSignals, type RankItem, type SearchDoc, type SellerSignals,
} from './index'

const NOW = new Date('2026-10-04T12:00:00Z').getTime()
const daysAgo = (d: number) => new Date(NOW - d * 86_400_000).toISOString()

type Spec = Partial<ProductSignals> & { id: string; sellerId: string; doc?: Partial<SearchDoc>; dupKey?: string }

/** An established, complete listing unless overridden. */
function product(spec: Spec): { signals: ProductSignals; doc: SearchDoc; dupKey?: string } {
  const { doc, dupKey, ...rest } = spec
  return {
    signals: {
      createdAt: daysAgo(200), updatedAt: daysAgo(30),
      ratingSum: 0, ratingWeight: 0, reviewCount: 0,
      sales: 0, recentSales: 0, refunds: 0, wishlists: 0, recentWishlists: 0, githubStars: 0,
      descriptionLength: 500, screenshotCount: 3, hasPreview: true, featureCount: 5, techCount: 3, tagCount: 3, hasSource: true,
      ...rest,
    },
    doc: {
      title: `Product ${spec.id}`,
      description: 'A production-ready project for developers.',
      tags: [], techStack: [], category: 'Web Apps & SaaS',
      ...doc,
    },
    dupKey,
  }
}

function seller(id: string, extra: Partial<SellerSignals> = {}): SellerSignals {
  return { id, ratingSum: 0, ratingWeight: 0, sales: 0, refunds: 0, verified: true, createdAt: daysAgo(400), ...extra }
}

function build(specs: ReturnType<typeof product>[], sellers?: SellerSignals[], seed = '2026-10-04') {
  const sellerList = sellers ?? Array.from(new Set(specs.map((s) => s.signals.sellerId))).map((id) => seller(id))
  const comps = computeComponents(specs.map((s) => s.signals), sellerList, { seed, now: NOW })
  const items: RankItem<null>[] = specs.map((s) => ({
    id: s.signals.id, sellerId: s.signals.sellerId, doc: s.doc, dupKey: s.dupKey,
    components: comps.get(s.signals.id)!, payload: null,
  }))
  const index = buildSearchIndex(items.map((i) => ({ id: i.id, doc: i.doc })))
  return { items, index, comps }
}

const good = { ratingSum: 4.7 * 20, ratingWeight: 20, reviewCount: 20, sales: 60, recentSales: 8, wishlists: 30 }
const ids = (r: { item: { id: string } }[]) => r.map((x) => x.item.id)
const sellersOf = (r: { item: { sellerId: string } }[]) => r.map((x) => x.item.sellerId)

describe('ranking: seller dominance (Test 1, Case A)', () => {
  it('a seller with 20 matching products does not take the whole first page of search', () => {
    const specs = [
      ...Array.from({ length: 20 }, (_, i) => product({ id: `a${i}`, sellerId: 'A', ...good, doc: { title: `AI chatbot kit ${i}`, description: `AI chatbot variant ${i}` } })),
      product({ id: 'b1', sellerId: 'B', ...good, doc: { title: 'AI chatbot for support teams' } }),
      product({ id: 'b2', sellerId: 'B', ...good, doc: { title: 'Customer chatbot with AI' } }),
      product({ id: 'c1', sellerId: 'C', ...good, doc: { title: 'AI chatbot starter' } }),
    ]
    const { items, index } = build(specs)
    const page1 = rankSearch(items, index, 'AI chatbot').slice(0, 12)
    expect(new Set(sellersOf(page1)).size).toBe(3)
    expect(sellersOf(page1).filter((s) => s === 'A').length).toBeLessThan(12)
    // Other sellers appear near the top, not just at the end of the page.
    expect(sellersOf(page1.slice(0, 5))).toEqual(expect.arrayContaining(['B', 'C']))
  })
})

describe('ranking: new products (Test 2, Case C)', () => {
  it('a brand-new listing with no evidence does not become #1 just for being newest', () => {
    const specs = [
      product({ id: 'old1', sellerId: 'A', ...good }),
      product({ id: 'old2', sellerId: 'B', ...good, ratingSum: 4.5 * 12, ratingWeight: 12, reviewCount: 12 }),
      product({ id: 'old3', sellerId: 'C', ...good, sales: 30, recentSales: 3 }),
      product({ id: 'new', sellerId: 'D', createdAt: daysAgo(0), updatedAt: daysAgo(0) }),
    ]
    const { items } = build(specs)
    const order = ids(rankDiscovery(items))
    expect(order[0]).not.toBe('new')
  })

  it('a new, incomplete listing gets no exploration boost', () => {
    const specs = [
      product({ id: 'thin', sellerId: 'A', createdAt: daysAgo(1), descriptionLength: 20, screenshotCount: 0, hasPreview: false, featureCount: 0, techCount: 0, tagCount: 0, hasSource: false }),
      product({ id: 'full', sellerId: 'B', createdAt: daysAgo(1) }),
    ]
    const { comps } = build(specs)
    expect(comps.get('thin')!.exploration).toBe(0)
    expect(comps.get('full')!.exploration).toBeGreaterThan(0.3)
  })
})

describe('ranking: relevance beats popularity (Test 3, Case E)', () => {
  it('a hugely popular but off-topic product ranks below a relevant one', () => {
    const specs = [
      product({ id: 'popular', sellerId: 'A', sales: 5000, recentSales: 400, wishlists: 900, ratingSum: 4.9 * 300, ratingWeight: 300, reviewCount: 300, githubStars: 90000,
        doc: { title: 'Admin dashboard template', description: 'Dashboard with charts. Also works as a template for a chatbot page.' } }),
      product({ id: 'relevant', sellerId: 'B', createdAt: daysAgo(5), doc: { title: 'AI Chatbot', description: 'An AI chatbot with retrieval and streaming answers.', tags: ['ai', 'chatbot'] } }),
    ]
    const { items, index } = build(specs)
    const order = ids(rankSearch(items, index, 'AI chatbot'))
    expect(order[0]).toBe('relevant')
  })

  it('matching both "Next.js" and "ecommerce" beats a generic template that only matches "template"', () => {
    const specs = [
      product({ id: 'generic', sellerId: 'A', ...good, sales: 900, recentSales: 80, doc: { title: 'Portfolio template', description: 'A clean template.' } }),
      product({ id: 'match', sellerId: 'B', doc: { title: 'Storefront starter', description: 'Next.js e-commerce store with cart and checkout.', techStack: ['Next.js'] } }),
      ...Array.from({ length: 6 }, (_, i) => product({ id: `t${i}`, sellerId: `S${i}`, doc: { title: `Landing template ${i}` } })),
    ]
    const { items, index } = build(specs)
    const ranked = rankSearch(items, index, 'Next.js ecommerce template')
    expect(ids(ranked)[0]).toBe('match')
    const rel = Object.fromEntries(ranked.map((r) => [r.item.id, r.explain.relevance ?? 0]))
    expect(rel.match).toBeGreaterThan((rel.generic ?? 0) * 2)
  })
})

describe('ranking: same-seller diminishing returns (Test 4, Case B, Case H)', () => {
  it('a seller with the three best products can still hold several top spots', () => {
    const specs = [
      product({ id: 'a1', sellerId: 'A', ...good, sales: 300, recentSales: 40, doc: { title: 'Python web scraper' } }),
      product({ id: 'a2', sellerId: 'A', ...good, sales: 250, recentSales: 30, doc: { title: 'Python scraping toolkit' } }),
      product({ id: 'a3', sellerId: 'A', ...good, sales: 200, recentSales: 25, doc: { title: 'Async Python crawler' } }),
      product({ id: 'b1', sellerId: 'B', doc: { title: 'Web utilities', description: 'Misc tools, includes a tiny python script.' } }),
      product({ id: 'c1', sellerId: 'C', doc: { title: 'Scraper notes', description: 'Notes.' } }),
    ]
    const { items, index } = build(specs)
    const top3 = sellersOf(rankSearch(items, index, 'python web scraper').slice(0, 3))
    expect(top3.filter((s) => s === 'A').length).toBeGreaterThanOrEqual(2)
  })

  it('each further item from the same seller receives a larger diversity penalty', () => {
    const specs = Array.from({ length: 6 }, (_, i) => product({ id: `a${i}`, sellerId: 'A', ...good }))
      .concat(Array.from({ length: 6 }, (_, i) => product({ id: `b${i}`, sellerId: `B${i}` })))
    const { items } = build(specs)
    const aPenalties = rankDiscovery(items).filter((r) => r.item.sellerId === 'A').map((r) => r.explain.diversityPenalty)
    expect(aPenalties[0]).toBe(0)
    for (let i = 1; i < 3; i++) expect(aPenalties[i]).toBeGreaterThan(aPenalties[i - 1])
  })
})

describe('ranking: duplicates (Test 5, Case G)', () => {
  it('never returns the same product twice, even if a candidate appears twice', () => {
    const specs = [product({ id: 'x', sellerId: 'A', ...good }), product({ id: 'y', sellerId: 'B' })]
    const { items } = build(specs)
    const doubled = [...items, items[0], items[0]]
    const order = ids(rankDiscovery(doubled))
    expect(order).toHaveLength(2)
    expect(new Set(order).size).toBe(2)
  })

  it('demotes a second listing of the same repository', () => {
    const specs = [
      product({ id: 'orig', sellerId: 'A', ...good, dupKey: 'acme/shop' }),
      product({ id: 'copy', sellerId: 'B', createdAt: daysAgo(10), dupKey: 'Acme/Shop' }),
      product({ id: 'other', sellerId: 'C', sales: 40, recentSales: 5, ratingSum: 4.4 * 10, ratingWeight: 10, reviewCount: 10 }),
    ]
    const { items } = build(specs)
    const ranked = rankDiscovery(items)
    const copy = ranked.find((r) => r.item.id === 'copy')!
    expect(copy.explain.duplicatePenalty).toBeGreaterThan(0)
    expect(ranked.find((r) => r.item.id === 'orig')!.explain.duplicatePenalty).toBe(0)
    expect(ids(ranked).indexOf('copy')).toBeGreaterThan(ids(ranked).indexOf('other'))
  })
})

describe('ranking: pagination (Test 6)', () => {
  it('pages are slices of one global order: no repeats, no gaps, diversity holds on every page', () => {
    const specs = [
      ...Array.from({ length: 30 }, (_, i) => product({ id: `a${i}`, sellerId: 'A', ...good, sales: 100 - i })),
      ...Array.from({ length: 12 }, (_, i) => product({ id: `o${i}`, sellerId: `S${i % 6}`, sales: 20 + i })),
    ]
    const { items } = build(specs)
    const full = ids(rankDiscovery(items))
    const pages = [0, 1, 2, 3].map((p) => full.slice(p * 12, p * 12 + 12))
    expect(pages.flat()).toEqual(full)
    expect(new Set(full).size).toBe(specs.length)
    // Ranking twice gives the same order (stable, no randomness).
    expect(ids(rankDiscovery(items))).toEqual(full)
    // Page 1 is not wall-to-wall seller A even though A has most of the inventory.
    const p1Sellers = pages[0].map((id) => (id.startsWith('a') ? 'A' : 'other'))
    expect(p1Sellers.filter((s) => s === 'other').length).toBeGreaterThanOrEqual(4)
  })
})

describe('ranking: query sensitivity (Test 7)', () => {
  it('different queries produce different leaders', () => {
    const specs = [
      product({ id: 'bot', sellerId: 'A', doc: { title: 'AI Chatbot', tags: ['llm'] } }),
      product({ id: 'shop', sellerId: 'B', doc: { title: 'Next.js Commerce', description: 'Headless e-commerce storefront.', techStack: ['Next.js'] } }),
      product({ id: 'scrape', sellerId: 'C', doc: { title: 'Web scraper', techStack: ['Python'] } }),
    ]
    const { items, index } = build(specs)
    expect(ids(rankSearch(items, index, 'AI chatbot'))[0]).toBe('bot')
    expect(ids(rankSearch(items, index, 'Next.js ecommerce'))[0]).toBe('shop')
    expect(ids(rankSearch(items, index, 'Python web scraper'))[0]).toBe('scrape')
  })

  it('understands synonyms, stemming and typos', () => {
    const specs = [
      product({ id: 'bot', sellerId: 'A', doc: { title: 'Support assistant powered by LLMs' } }),
      product({ id: 'dash', sellerId: 'B', doc: { title: 'Analytics dashboard' } }),
      product({ id: 'scrape', sellerId: 'C', doc: { title: 'Scraping toolkit' } }),
    ]
    const { items, index } = build(specs)
    expect(ids(rankSearch(items, index, 'AI chatbot'))[0]).toBe('bot')
    expect(ids(rankSearch(items, index, 'dashbaord'))[0]).toBe('dash')
    expect(ids(rankSearch(items, index, 'scraper'))[0]).toBe('scrape')
  })

  it('keyword stuffing has sharply diminishing returns', () => {
    const specs = [
      product({ id: 'honest', sellerId: 'A', doc: { title: 'AI chatbot', description: 'An AI chatbot.' } }),
      product({ id: 'stuffed', sellerId: 'B', doc: { title: 'AI chatbot', description: 'chatbot '.repeat(200) } }),
    ]
    const { items, index } = build(specs)
    const rel = Object.fromEntries(rankSearch(items, index, 'AI chatbot').map((r) => [r.item.id, r.explain.relevance!]))
    expect(rel.stuffed - rel.honest).toBeLessThan(0.05)
  })
})

describe('ranking: exploration (Test 8, Case F, Case D)', () => {
  it('a new, highly relevant product with no sales gets a fair spot in search', () => {
    const specs = [
      ...Array.from({ length: 8 }, (_, i) => product({ id: `est${i}`, sellerId: `E${i}`, ...good, doc: { title: `AI chatbot ${i}`, description: 'A chatbot.' } })),
      product({ id: 'fresh', sellerId: 'N', createdAt: daysAgo(2), updatedAt: daysAgo(2), doc: { title: 'AI chatbot with voice', description: 'An AI chatbot with voice and memory.', tags: ['ai', 'chatbot'] } }),
    ]
    const { items, index } = build(specs)
    const pos = ids(rankSearch(items, index, 'AI chatbot')).indexOf('fresh')
    expect(pos).toBeGreaterThanOrEqual(0)
    expect(pos).toBeLessThan(6)
  })

  it('an old product with excellent ratings and sales is not buried by newer listings', () => {
    const specs = [
      product({ id: 'classic', sellerId: 'A', createdAt: daysAgo(900), updatedAt: daysAgo(300), ...good, sales: 800, recentSales: 60, ratingSum: 4.9 * 150, ratingWeight: 150, reviewCount: 150 }),
      ...Array.from({ length: 10 }, (_, i) => product({ id: `n${i}`, sellerId: `N${i}`, createdAt: daysAgo(i + 1) })),
    ]
    const { items } = build(specs)
    expect(ids(rankDiscovery(items)).indexOf('classic')).toBeLessThan(2)
  })

  it('exploration rotates between days but is stable within a day', () => {
    const specs = Array.from({ length: 10 }, (_, i) => product({ id: `n${i}`, sellerId: `S${i}`, createdAt: daysAgo(3) }))
    const day1 = ids(rankDiscovery(build(specs, undefined, '2026-10-04').items))
    const day1Again = ids(rankDiscovery(build(specs, undefined, '2026-10-04').items))
    const day2 = ids(rankDiscovery(build(specs, undefined, '2026-10-05').items))
    expect(day1Again).toEqual(day1)
    expect(day2).not.toEqual(day1)
  })
})

describe('ranking: /products default listing (Test 9, Test 10)', () => {
  it('is not ORDER BY created_at DESC or id DESC', () => {
    const specs = [
      product({ id: 'p1', sellerId: 'A', createdAt: daysAgo(400), ...good, sales: 400, recentSales: 30 }),
      product({ id: 'p2', sellerId: 'B', createdAt: daysAgo(300), sales: 2 }),
      product({ id: 'p3', sellerId: 'C', createdAt: daysAgo(200), ...good }),
      product({ id: 'p4', sellerId: 'D', createdAt: daysAgo(100) }),
      product({ id: 'p5', sellerId: 'E', createdAt: daysAgo(1), descriptionLength: 30, screenshotCount: 0, hasPreview: false }),
    ]
    const { items } = build(specs)
    const order = ids(rankDiscovery(items))
    const byNewest = [...specs].sort((a, b) => String(b.signals.createdAt).localeCompare(String(a.signals.createdAt))).map((s) => s.signals.id)
    const byIdDesc = [...order].sort().reverse()
    expect(order).not.toEqual(byNewest)
    expect(order).not.toEqual(byIdDesc)
    expect(order[0]).toBe('p1')
  })

  it('a seller with most of the inventory does not fill the top of /products', () => {
    const specs = [
      ...Array.from({ length: 50 }, (_, i) => product({ id: `a${i}`, sellerId: 'A', ...good })),
      ...Array.from({ length: 10 }, (_, i) => product({ id: `b${i}`, sellerId: 'B', ...good, sales: 40 })),
      ...Array.from({ length: 5 }, (_, i) => product({ id: `c${i}`, sellerId: 'C', ...good, sales: 35 })),
      ...Array.from({ length: 3 }, (_, i) => product({ id: `d${i}`, sellerId: 'D', ...good, sales: 30 })),
    ]
    const { items } = build(specs)
    const top12 = sellersOf(rankDiscovery(items).slice(0, 12))
    expect(new Set(top12).size).toBe(4)
    expect(top12.filter((s) => s === 'A').length).toBeLessThanOrEqual(6)
    // No long same-seller runs at the top.
    let run = 1
    for (let i = 1; i < top12.length; i++) {
      run = top12[i] === top12[i - 1] ? run + 1 : 1
      expect(run).toBeLessThanOrEqual(3)
    }
  })
})
