import { describe, it, expect } from 'vitest'
import { computeLicensePrice, normalizeLicenseType } from './license-pricing'

describe('normalizeLicenseType', () => {
  it('accepts known tiers case-insensitively', () => {
    expect(normalizeLicenseType('commercial')).toBe('commercial')
    expect(normalizeLicenseType('Extended')).toBe('extended')
    expect(normalizeLicenseType('PERSONAL')).toBe('personal')
  })

  it('rejects anything else', () => {
    expect(normalizeLicenseType('enterprise')).toBeNull()
    expect(normalizeLicenseType('')).toBeNull()
  })
})

describe('computeLicensePrice', () => {
  it('charges the base price for personal/commercial tiers', () => {
    expect(computeLicensePrice(40, 'personal')).toBe(40)
    expect(computeLicensePrice(40, 'commercial')).toBe(40)
  })

  it('charges 2.5x for the extended tier', () => {
    expect(computeLicensePrice(40, 'extended')).toBe(100)
  })

  it('is always free for a free product regardless of tier', () => {
    expect(computeLicensePrice(0, 'extended')).toBe(0)
  })

  it('falls back to the base price for an unrecognized tier', () => {
    expect(computeLicensePrice(40, 'made-up-tier')).toBe(40)
  })
})
