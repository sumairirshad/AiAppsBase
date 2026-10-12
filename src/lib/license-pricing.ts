export const LICENSE_TYPES = ['personal', 'commercial', 'extended'] as const
export type LicenseType = (typeof LICENSE_TYPES)[number]

/** Multiplier applied to a product's base price for each license tier. */
const LICENSE_MULTIPLIERS: Record<LicenseType, number> = {
  personal: 1,
  commercial: 1,
  extended: 2.5,
}

export function normalizeLicenseType(value: string): LicenseType | null {
  const lower = value.toLowerCase()
  return (LICENSE_TYPES as readonly string[]).includes(lower) ? (lower as LicenseType) : null
}

/**
 * The price a buyer owes for a given license tier. Free products (price 0)
 * stay free regardless of tier. This must be the single source of truth for
 * tier pricing — anywhere that charges or displays a price for a licensed
 * product should go through it, so the server never charges less than the
 * UI shows.
 */
export function computeLicensePrice(basePrice: number, licenseType: string): number {
  if (basePrice === 0) return 0
  const tier = normalizeLicenseType(licenseType)
  const multiplier = tier ? LICENSE_MULTIPLIERS[tier] : 1
  return Math.round(basePrice * multiplier)
}
