import fs from 'fs'
import os from 'os'
import path from 'path'
import type { NextRequest } from 'next/server'
import { beforeAll, describe, expect, it, vi } from 'vitest'

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'assets-route-'))
vi.stubEnv('ASSETS_DIR', tmp)

// The SFTP client itself is covered by sftp.ts's own tests; here we only
// need downloadProductImageStream to behave like a miss, the way it does for
// a pre-migration image that was never copied to the SFTP server.
vi.mock('@/lib/sftp', () => ({
  downloadProductImageStream: vi.fn().mockRejectedValue(new Error('no such file')),
}))

type Mod = typeof import('./route')
let GET: Mod['GET']
beforeAll(async () => {
  GET = (await import('./route')).GET
})

const U = '5903d025-0686-4ccd-9cc6-6d38f79fe90e'
const P = '11111111-2222-3333-4444-555555555555'
const FILE = '1700000000000-abc123-screenshot.png'
const PNG_BYTES = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

describe('GET /assets/products/[userId]/[productId]/[file]', () => {
  it('falls back to local disk when the image predates the move to SFTP', async () => {
    const dir = path.join(tmp, 'products', U, P)
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(path.join(dir, FILE), PNG_BYTES)

    const res = await GET({} as NextRequest, { params: { userId: U, productId: P, file: FILE } })

    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toBe('image/png')
    expect(Buffer.from(await res.arrayBuffer())).toEqual(PNG_BYTES)
  })

  it('404s when the file is on neither SFTP nor local disk', async () => {
    const res = await GET({} as NextRequest, { params: { userId: U, productId: P, file: 'nowhere.png' } })
    expect(res.status).toBe(404)
  })

  it('404s for a path that fails validation before any lookup', async () => {
    const res = await GET({} as NextRequest, { params: { userId: 'not-a-uuid', productId: P, file: FILE } })
    expect(res.status).toBe(404)
  })
})
