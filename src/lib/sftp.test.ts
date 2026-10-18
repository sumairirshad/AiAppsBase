import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Readable } from 'stream'

vi.stubEnv('SFTP_HOST', 'test-sftp-host')
vi.stubEnv('SFTP_USERNAME', 'test-user')
vi.stubEnv('SFTP_PASSWORD', 'test-pass')
vi.stubEnv('SFTP_REMOTE_DIR', '/remote')

// Controls what the next fake client does, per test — lets each test
// simulate a specific real-world failure (mkdir races, permission errors, a
// failed put, a mid-upload connection drop that may or may not recur on
// retry) without a real SFTP server.
const behavior = {
  mkdirError: null as Error | null,
  putError: null as Error | null,
  renameError: null as Error | null,
  /** Simulates a dropped connection on this put number *within the current connection* (1-indexed). */
  dropConnectionOnPutNumber: null as number | null,
  /** If true, the drop re-arms on every fresh connection (simulates a server that's down, not just a one-off blip). */
  dropOnEveryConnection: false,
}
const puts: { remotePath: string; data: Buffer }[] = []
const renames: { from: string; to: string }[] = []
const deletes: string[] = []
let connectCount = 0
let endCount = 0
let putsSinceConnect = 0
let dropAlreadyFired = false

async function readAllFromStreamOrBuffer(data: Buffer | NodeJS.ReadableStream): Promise<Buffer> {
  if (Buffer.isBuffer(data)) return data
  const chunks: Buffer[] = []
  for await (const chunk of data as AsyncIterable<Buffer>) chunks.push(chunk)
  return Buffer.concat(chunks)
}

vi.mock('ssh2-sftp-client', () => ({
  default: class FakeSftpClient {
    private handlers: Record<string, Array<(err: Error) => void>> = {}

    on(event: string, handler: (err: Error) => void) {
      (this.handlers[event] ??= []).push(handler)
      return this
    }

    async connect() {
      connectCount++
      putsSinceConnect = 0
      if (behavior.dropOnEveryConnection) dropAlreadyFired = false
    }

    async end() {
      endCount++
    }

    async mkdir() {
      if (behavior.mkdirError) throw behavior.mkdirError
    }

    async put(data: Buffer | NodeJS.ReadableStream, remotePath: string) {
      const buf = await readAllFromStreamOrBuffer(data)
      if (behavior.putError) throw behavior.putError
      putsSinceConnect++
      puts.push({ remotePath, data: buf })

      if (behavior.dropConnectionOnPutNumber === putsSinceConnect && !dropAlreadyFired) {
        dropAlreadyFired = true
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

    async rename(from: string, to: string) {
      if (behavior.renameError) throw behavior.renameError
      renames.push({ from, to })
    }

    async delete(remotePath: string) {
      deletes.push(remotePath)
    }

    async stat(remotePath: string) {
      // A renamed path is no longer in `puts` under its final name — resolve
      // back to whatever temp path it was actually put() under, if any.
      const renamedFrom = renames.find((r) => r.to === remotePath)?.from
      const match = puts.find((p) => p.remotePath === remotePath || p.remotePath === renamedFrom)
      if (!match) throw new Error('No such file')
      return { size: match.data.length }
    }
  },
}))

type Mod = typeof import('./sftp')
let m: Mod
beforeEach(async () => {
  m = await import('./sftp')
  behavior.mkdirError = null
  behavior.putError = null
  behavior.renameError = null
  behavior.dropConnectionOnPutNumber = null
  behavior.dropOnEveryConnection = false
  puts.length = 0
  renames.length = 0
  deletes.length = 0
  connectCount = 0
  endCount = 0
  putsSinceConnect = 0
  dropAlreadyFired = false
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
  const threeFiles = [
    { buffer: Buffer.from('a'), fileName: 'a.png' },
    { buffer: Buffer.from('b'), fileName: 'b.png' },
    { buffer: Buffer.from('c'), fileName: 'c.png' },
  ]

  it('uploads every file over exactly one connection', async () => {
    await m.uploadProductImages(U, P, threeFiles)
    expect(connectCount).toBe(1)
    expect(endCount).toBe(1)
    expect(puts.map((p) => p.remotePath)).toEqual([
      `/remote/product-images/${U}/${P}/a.png`,
      `/remote/product-images/${U}/${P}/b.png`,
      `/remote/product-images/${U}/${P}/c.png`,
    ])
  })

  it('does not open a connection at all when there are no files', async () => {
    await m.uploadProductImages(U, P, [])
    expect(connectCount).toBe(0)
  })

  it('fails fast instead of hanging when the connection drops mid-batch', async () => {
    // Regression test for the real-world symptom: several "read ECONNRESET"
    // log lines followed by the whole request hanging for ~24s before
    // ultimately failing. Without guardAgainstDroppedConnection in
    // src/lib/sftp.ts, this test would time out (the fake put() above never
    // resolves on its own) instead of rejecting/recovering quickly. Here
    // the drop only happens once, so the retry below succeeds.
    behavior.dropConnectionOnPutNumber = 2

    await m.uploadProductImages(U, P, threeFiles)

    // One dropped connection (a, b attempted, b triggers the drop) + one
    // clean retry from scratch (a, b, c all succeed) = 5 put calls, 2
    // connections.
    expect(connectCount).toBe(2)
    expect(endCount).toBe(2)
    expect(puts).toHaveLength(5)
  })

  it('still fails once retries are exhausted against a connection that keeps dropping', async () => {
    behavior.dropConnectionOnPutNumber = 2
    behavior.dropOnEveryConnection = true // every fresh connection hits the same drop — a truly dead link, not a blip

    await expect(m.uploadProductImages(U, P, threeFiles)).rejects.toThrow('read ECONNRESET')

    expect(connectCount).toBe(2) // one real attempt + one retry, then give up
    expect(endCount).toBe(2)
  })

  it('does not retry a non-connection failure like a permission error', async () => {
    behavior.mkdirError = new Error('Permission denied')
    await expect(m.uploadProductImages(U, P, threeFiles)).rejects.toThrow('Permission denied')
    expect(connectCount).toBe(1) // no point retrying — a fresh connection won't fix a permission error
  })
})

describe('buildVersionRemotePath', () => {
  it('builds a stable, collision-resistant path under the product/versions folder', () => {
    const p = m.buildVersionRemotePath(P, 'version-id-1', 'My App!!.zip')
    expect(p).toBe(`/remote/${P}/versions/version-id-1-My-App.zip`)
  })
})

describe('uploadStreamToDeliverablePath', () => {
  it('uploads to a .part temp path and renames into place only once the stream fully succeeds', async () => {
    const content = Buffer.from('fake archive content')
    await m.uploadStreamToDeliverablePath(Readable.from([content]), `/remote/${P}/versions/v1-app.zip`)

    expect(puts).toHaveLength(1)
    expect(puts[0].remotePath).toBe(`/remote/${P}/versions/v1-app.zip.part`)
    expect(puts[0].data.equals(content)).toBe(true)
    expect(renames).toEqual([{ from: `/remote/${P}/versions/v1-app.zip.part`, to: `/remote/${P}/versions/v1-app.zip` }])
    // The real path never exists as a separate put — only the rename makes it visible.
    expect(puts.some((p) => p.remotePath === `/remote/${P}/versions/v1-app.zip`)).toBe(false)
  })

  it('deletes the temp file and never renames when the upload itself fails', async () => {
    behavior.putError = new Error('No space left on device')
    await expect(
      m.uploadStreamToDeliverablePath(Readable.from([Buffer.from('x')]), `/remote/${P}/versions/v1-app.zip`)
    ).rejects.toThrow('No space left on device')

    expect(renames).toHaveLength(0)
    expect(deletes).toEqual([`/remote/${P}/versions/v1-app.zip.part`])
  })

  it('deletes the temp file and propagates the error when the rename itself fails', async () => {
    behavior.renameError = new Error('Permission denied on rename')
    await expect(
      m.uploadStreamToDeliverablePath(Readable.from([Buffer.from('x')]), `/remote/${P}/versions/v1-app.zip`)
    ).rejects.toThrow('Permission denied on rename')

    expect(deletes).toEqual([`/remote/${P}/versions/v1-app.zip.part`])
  })

  it('closes the connection in all cases (success and failure)', async () => {
    await m.uploadStreamToDeliverablePath(Readable.from([Buffer.from('ok')]), `/remote/${P}/versions/ok.zip`)
    expect(endCount).toBe(1)

    behavior.putError = new Error('boom')
    await expect(
      m.uploadStreamToDeliverablePath(Readable.from([Buffer.from('x')]), `/remote/${P}/versions/fail.zip`)
    ).rejects.toThrow()
    expect(endCount).toBe(2)
  })
})

describe('statRemoteDeliverable', () => {
  it('returns the stored size for an existing file', async () => {
    const content = Buffer.from('12345')
    await m.uploadStreamToDeliverablePath(Readable.from([content]), `/remote/${P}/versions/sized.zip`)
    await expect(m.statRemoteDeliverable(`/remote/${P}/versions/sized.zip`)).resolves.toBe(content.length)
  })

  it('returns null for a file that does not exist, instead of throwing', async () => {
    await expect(m.statRemoteDeliverable(`/remote/${P}/versions/missing.zip`)).resolves.toBeNull()
  })
})
