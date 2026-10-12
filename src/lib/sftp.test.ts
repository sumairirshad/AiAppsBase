import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.stubEnv('SFTP_HOST', 'test-sftp-host')
vi.stubEnv('SFTP_USERNAME', 'test-user')
vi.stubEnv('SFTP_PASSWORD', 'test-pass')
vi.stubEnv('SFTP_REMOTE_DIR', '/remote')

// Controls what the next fake client does, per test — lets each test
// simulate a specific real-world failure (mkdir races, permission errors,
// a failed put) without a real SFTP server.
const behavior = {
  mkdirError: null as Error | null,
  putError: null as Error | null,
}
const puts: { remotePath: string; data: Buffer }[] = []

vi.mock('ssh2-sftp-client', () => ({
  default: class FakeSftpClient {
    async connect() {}
    async end() {}
    async mkdir() {
      if (behavior.mkdirError) throw behavior.mkdirError
    }
    async put(data: Buffer, remotePath: string) {
      if (behavior.putError) throw behavior.putError
      puts.push({ remotePath, data })
    }
  },
}))

type Mod = typeof import('./sftp')
let m: Mod
beforeEach(async () => {
  m = await import('./sftp')
  behavior.mkdirError = null
  behavior.putError = null
  puts.length = 0
})

const U = '5903d025-0686-4ccd-9cc6-6d38f79fe90e'
const P = '11111111-2222-3333-4444-555555555555'

describe('uploadProductImage', () => {
  it('uploads normally when mkdir and put both succeed', async () => {
    await m.uploadProductImage(Buffer.from('img'), U, P, 'shot.png')
    expect(puts).toEqual([{ remotePath: `/remote/product-images/${U}/${P}/shot.png`, data: Buffer.from('img') }])
  })

  it('tolerates a concurrent upload having already created the folder', async () => {
    // Two uploads for the same product racing to create the same new
    // {userId}/{productId} folder can have the loser's mkdir fail with
    // "already exists" from the real server — that must not block the
    // upload itself (see the regression this guards: src/app/api/products/route.ts
    // used to run these uploads concurrently via Promise.all).
    behavior.mkdirError = new Error('mkdir: /remote/product-images/x/y: already exists')

    await m.uploadProductImage(Buffer.from('img'), U, P, 'shot.png')

    expect(puts).toHaveLength(1)
  })

  it('still fails when mkdir fails for a real reason', async () => {
    behavior.mkdirError = new Error('Permission denied')
    await expect(m.uploadProductImage(Buffer.from('img'), U, P, 'shot.png')).rejects.toThrow('Permission denied')
    expect(puts).toHaveLength(0)
  })

  it('still fails when the file write itself fails', async () => {
    behavior.putError = new Error('No such file or directory')
    await expect(m.uploadProductImage(Buffer.from('img'), U, P, 'shot.png')).rejects.toThrow('No such file or directory')
  })
})
