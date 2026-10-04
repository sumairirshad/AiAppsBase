import Stripe from 'stripe'

let client: Stripe | null = null

/**
 * Creates the Stripe client on first use rather than at import time, so a
 * missing key only fails requests that actually use Stripe — not module
 * loading (e.g. `next build` collecting page data for every route).
 */
function getStripe(): Stripe {
  if (!client) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY is not set in environment variables')
    }
    client = new Stripe(key, {
      apiVersion: '2026-05-27.dahlia',
    })
  }
  return client
}

export const stripe = new Proxy({} as Stripe, {
  get: (_target, prop) => Reflect.get(getStripe(), prop),
})
