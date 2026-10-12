import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.stubEnv('SFTP_HOST', 'test-sftp-host')
vi.stubEnv('SFTP_USERNAME', 'test-user')
vi.stubEnv('SFTP_PASSWORD', 'test-pass')
vi.stubEnv('SFTP_REMOTE_DIR', '/remote')

// Controls what the next fake client does, per test — lets each test
// simulate a specific real-world failure (mkdir races, permission errors, a
// failed put, a mid-upload connection drop) without a real SFTP server.
const behavior = {
  mkdirError: null as Error | null,
  putError: null as Error | null,
  /** Simulates a dropped connection on the Nth put (1-indexed). */
  dropConnectionOnPutNumber: null as number | null,
}
const puts: { remotePath: string; data: Buffer }[] = []
let connectCount = 0
let endCount = 0

vi.mock('ssh2-sftp-client', () => ({
  default: class FakeSftpClient {
    private handlers: Record<string, Array<(err: Error) => void>> = {}

    on(event: string, handler: (err: Error) => void) {
      (this.handlers[event] ??= []).push(handler)
      return this
    }

    async connect() {
      connectCount++
    }

    async end() {
      endCount++
    }

    async mkdir() {
      if (behavior.mkdirError) throw behavior.mkdirError
    }

    async put(data: Buffer, remotePath: string) {
      if (behavior.putError) throw behavior.putError
      puts.push({ remotePath, data })

      if (behavior.dropConnectionOnPutNumber === puts.length) {
        // Mirrors the real bug this guards against: ssh2-sftp-client's own
        // global listener handles the socket's "error" event and marks it
        // handled before this operation's own listener can reject its
        // promise — so the real client.put() call just hangs forever here,
        // even though the connection has already died. Our code must not
        // rely on that promise settling; it has to notice the "error"
        // event itself.
        const err = new Error('read ECONNRESET')
        for (const h of this.handlers.error ?? []) h(err)
        return new Promise(() => {})
      }
    }
  },
}))

type Mod = typeof import('./sftp')
let m: Mod
beforeEach(async () => {
  m = await import('./sftp')
  behavior.mkdirError = null
  behavior.putError = null
  behavior.dropConnectionOnPutNumber = null
  puts.length = 0
  connectCount = 0
  endCount = 0
})

const U = '5903d025-0686-4ccd-9cc6-6d38f79fe90e'
const P = '11111111-2222-3333-4444-555555555555'

describe('uploadProductImage', () => {
  it('uploads normally when mkdir and put both succeed', async () => {
    await m.uploadProductImage(Buffer.from('img'), U, P, 'shot.png')
    expect(puts).toEqual([{ remotePath: `/remote/product-images/${U}/${P}/shot.png`, data: Buffer.from('img') }])
  })

  it('tolerates a concurrent upload having already created the folder', async () => {
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

describe('uploadProductImages (batch)', () => {
  it('uploads every file over exactly one connection', async () => {
    await m.uploadProductImages(U, P, [
      { buffer: Buffer.from('a'), fileName: 'a.png' },
      { buffer: Buffer.from('b'), fileName: 'b.png' },
      { buffer: Buffer.from('c'), fileName: 'c.png' },
    ])
    expect(connectCount).toBe(1)
    expect(endCount).toBe(1)
    expect(puts.map((p) => p.remotePath)).toEqual([
      `/remote/product-images/${U}/${P}/a.png`,
      `/remote/product-images/${U}/${P}/b.png`,
      `/remote/product-images/${U}/${P}/c.png`,
    ])
  })

  it('fails fast instead of hanging when the connection drops mid-batch', async () => {
    // Regression test for the real-world symptom: several "read ECONNRESET"
    // log lines followed by the whole request hanging for ~24s before
    // ultimately failing. Without guardAgainstDroppedConnection in
    // src/lib/sftp.ts, this test would time out (the fake put() above never
    // resolves on its own) instead of rejecting quickly.
    behavior.dropConnectionOnPutNumber = 2

    await expect(
      m.uploadProductImages(U, P, [
        { buffer: Buffer.from('a'), fileName: 'a.png' },
        { buffer: Buffer.from('b'), fileName: 'b.png' },
        { buffer: Buffer.from('c'), fileName: 'c.png' },
      ])
    ).rejects.toThrow('read ECONNRESET')

    // The third file was never attempted once the connection dropped.
    expect(puts).toHaveLength(2)
    expect(endCount).toBe(1)
  })
})
