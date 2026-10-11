import { describe, it, expect } from 'vitest'
import type { NextRequest } from 'next/server'
import { isDatabaseConfigured, query } from './db'
import { rateLimit } from './rate-limit'

function fakeRequest(ip: string): NextRequest {
  return { headers: { get: (name: string) => (name === 'x-forwarded-for' ? ip : null) } } as unknown as NextRequest
}

describe.skipIf(!isDatabaseConfigured())('rateLimit', () => {
  it('allows requests under the limit and blocks once it is exceeded', async () => {
    const routeKey = `test:${Date.now()}:${Math.random()}`
    const req = fakeRequest('1.2.3.4')

    expect(await rateLimit(req, routeKey, 2, 60)).toBeNull()
    expect(await rateLimit(req, routeKey, 2, 60)).toBeNull()

    const blocked = await rateLimit(req, routeKey, 2, 60)
    expect(blocked).not.toBeNull()
    expect(blocked!.status).toBe(429)
    expect(blocked!.headers.get('Retry-After')).toBeTruthy()
  })

  it('tracks each IP independently under the same route key', async () => {
    const routeKey = `test:${Date.now()}:${Math.random()}`

    expect(await rateLimit(fakeRequest('5.5.5.5'), routeKey, 1, 60)).toBeNull()
    expect(await rateLimit(fakeRequest('5.5.5.5'), routeKey, 1, 60)).not.toBeNull()
    // A different IP on the same route key gets its own fresh window.
    expect(await rateLimit(fakeRequest('6.6.6.6'), routeKey, 1, 60)).toBeNull()
  })

  it('resets the count once the window has elapsed', async () => {
    const routeKey = `test:${Date.now()}:${Math.random()}`
    const req = fakeRequest('7.7.7.7')

    expect(await rateLimit(req, routeKey, 1, 1)).toBeNull()
    expect(await rateLimit(req, routeKey, 1, 1)).not.toBeNull()

    // Backdate the window instead of sleeping, so the test stays fast.
    await query('UPDATE rate_limits SET window_start = NOW() - INTERVAL \'2 seconds\' WHERE key = $1', [
      `${routeKey}:7.7.7.7`,
    ])

    expect(await rateLimit(req, routeKey, 1, 1)).toBeNull()
  })
})
