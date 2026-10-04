/**
 * Result-set post-processing: exact de-duplication, near-duplicate demotion
 * and seller diversification. Runs over the complete ranked candidate set
 * before pagination, so every page is a slice of one consistent order.
 */

import { tokenize } from './text'

export type Scored = { id: string; sellerId: string; score: number; title: string; dupKey?: string; titleTokens?: string[] }

/** Keeps one entry per product id (the highest-scoring one). */
export function dedupeById<T extends Scored>(items: T[]): T[] {
  const best = new Map<string, T>()
  for (const it of items) {
    const cur = best.get(it.id)
    if (!cur || it.score > cur.score) best.set(it.id, it)
  }
  return Array.from(best.values())
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0
  let inter = 0
  a.forEach((t) => b.has(t) && inter++)
  return inter / (a.size + b.size - inter)
}

/**
 * Finds near-duplicates: listings of the same source repo, identical titles
 * across sellers, or very similar titles from the same seller. Returns the
 * ids to demote (every member of a group except its best-scoring one).
 */
export function findNearDuplicates(items: Scored[]): Set<string> {
  const demote = new Set<string>()
  const byScore = [...items].sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))

  const seenKey = new Map<string, string>()
  const seenTitle = new Map<string, string>()
  for (const it of byScore) {
    const key = it.dupKey?.trim().toLowerCase()
    if (key) {
      if (seenKey.has(key)) demote.add(it.id)
      else seenKey.set(key, it.id)
    }
    const titleKey = [...(it.titleTokens ?? tokenize(it.title))].sort().join(' ')
    if (titleKey) {
      if (seenTitle.has(titleKey)) demote.add(it.id)
      else seenTitle.set(titleKey, it.id)
    }
  }

  // Same seller, near-identical titles (e.g. "SaaS Starter" vs "SaaS Starter Kit Pro").
  const bySeller = new Map<string, { id: string; tokens: Set<string> }[]>()
  for (const it of byScore) {
    const list = bySeller.get(it.sellerId) ?? []
    const tokens = new Set(it.titleTokens ?? tokenize(it.title))
    if (!demote.has(it.id) && list.some((o) => jaccard(o.tokens, tokens) >= 0.8)) demote.add(it.id)
    list.push({ id: it.id, tokens })
    bySeller.set(it.sellerId, list)
  }
  return demote
}

export type DiversityOptions = {
  /** Score multiplier per same-seller item already in the recent window (soft, diminishing returns). */
  decay: number
  /** How many recent positions count toward a seller's penalty (about one page). */
  window: number
}

/**
 * Greedy seller-aware re-ranking. At each position, every seller's best
 * remaining item competes with its score multiplied by decay^n, where n is
 * how many of that seller's items are among the last `window` positions.
 * A seller with genuinely stronger items still places several of them; one
 * with many mediocre items can't crowd others out.
 */
export function diversify<T extends Scored>(items: T[], { decay, window }: DiversityOptions): { item: T; adjusted: number }[] {
  const queues = new Map<string, T[]>()
  for (const it of [...items].sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))) {
    const q = queues.get(it.sellerId) ?? []
    q.push(it)
    queues.set(it.sellerId, q)
  }

  // Max-heap of each seller's current head. A placement only changes the
  // penalty of the placed seller and of the seller leaving the window, so
  // only those are re-pushed; stale entries are skipped via a version number.
  type Entry = { seller: string; item: T; adjusted: number; version: number }
  const better = (a: Entry, b: Entry) =>
    a.adjusted !== b.adjusted ? a.adjusted > b.adjusted
      : a.item.score !== b.item.score ? a.item.score > b.item.score
      : a.item.id < b.item.id
  const heap: Entry[] = []
  const push = (e: Entry) => {
    heap.push(e)
    let i = heap.length - 1
    while (i > 0) {
      const p = (i - 1) >> 1
      if (!better(heap[i], heap[p])) break
      ;[heap[i], heap[p]] = [heap[p], heap[i]]
      i = p
    }
  }
  const pop = (): Entry | undefined => {
    const top = heap[0]
    const last = heap.pop()
    if (heap.length && last) {
      heap[0] = last
      let i = 0
      for (;;) {
        const l = 2 * i + 1
        const r = l + 1
        let m = i
        if (l < heap.length && better(heap[l], heap[m])) m = l
        if (r < heap.length && better(heap[r], heap[m])) m = r
        if (m === i) break
        ;[heap[i], heap[m]] = [heap[m], heap[i]]
        i = m
      }
    }
    return top
  }

  const inWindow = new Map<string, number>()
  const version = new Map<string, number>()
  const refresh = (seller: string) => {
    const head = queues.get(seller)?.[0]
    const v = (version.get(seller) ?? 0) + 1
    version.set(seller, v)
    if (head) push({ seller, item: head, adjusted: head.score * Math.pow(decay, inWindow.get(seller) ?? 0), version: v })
  }
  queues.forEach((_, seller) => refresh(seller))

  const out: { item: T; adjusted: number }[] = []
  const recent: string[] = []
  while (heap.length) {
    const e = pop()!
    if (e.version !== version.get(e.seller)) continue
    queues.get(e.seller)!.shift()
    out.push({ item: e.item, adjusted: e.adjusted })
    recent.push(e.seller)
    inWindow.set(e.seller, (inWindow.get(e.seller) ?? 0) + 1)
    const changed = new Set([e.seller])
    if (recent.length > window) {
      const dropped = recent.shift()!
      inWindow.set(dropped, (inWindow.get(dropped) ?? 1) - 1)
      changed.add(dropped)
    }
    changed.forEach(refresh)
  }
  return out
}
