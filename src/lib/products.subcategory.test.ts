import { describe, it, expect } from 'vitest'
import { mapRow } from './products'
import { CATEGORIES } from './marketplace-config'

/**
 * Regression test for the "subcategory field is collected nowhere" bug:
 * the product forms now save one of these exact names into
 * products.subcategory, and every marketing landing page links to
 * /products?subcategory=<slug> using the matching slug from this same
 * config. If a listing's saved subcategory name ever drifted from this
 * list, mapRow's slug would silently fall back to an ad-hoc slugification
 * that no landing page link matches, and the filter would again return
 * nothing — exactly the original bug.
 */
describe('mapRow — subcategory slug matches the marketplace taxonomy', () => {
  it('computes the correct slug for every real category/subcategory pair', () => {
    for (const category of CATEGORIES) {
      for (const sub of category.subcategories) {
        const repo = mapRow({ id: 'p1', title: 'Test', category: category.name, subcategory: sub.name })
        expect(repo.subcategorySlug).toBe(sub.slug)
        expect(repo.categorySlug).toBe(category.slug)
      }
    }
  })

  it('leaves subcategory and its slug empty when no subcategory was set (it is optional)', () => {
    const repo = mapRow({ id: 'p1', title: 'Test', category: 'Websites', subcategory: null })
    expect(repo.subcategory).toBe('')
    expect(repo.subcategorySlug).toBe('')
  })
})
