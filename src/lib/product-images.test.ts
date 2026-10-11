import fs from 'fs'
import os from 'os'
import path from 'path'
import { beforeAll, describe, expect, it, vi } from 'vitest'

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'assets-'))
vi.stubEnv('ASSETS_DIR', tmp)

vi.stubEnv('SFTP_HOST', 'test-sftp-host')
vi.stubEnv('SFTP_USERNAME', 'test-user')
vi.stubEnv('SFTP_PASSWORD', 'test-pass')
vi.stubEnv('SFTP_REMOTE_DIR', '/remote')

// Product images are uploaded over SFTP (same storage deliverables use), so
// writeProductImage/deleteProductImageDir etc. are tested here against an
// in-memory fake of the remote filesystem rather than a real SFTP server.
const remoteFiles = new Map<string, Buffer>()

vi.mock('ssh2-sftp-client', () => ({
  default: class FakeSftpClient {
    async connect() {}
    async end() {}
    async mkdir() {}
    async put(data: Buffer, remotePath: string) {
      remoteFiles.set(remotePath, data)
    }
    async delete(remotePath: string) {
      remoteFiles.delete(remotePath)
    }
    async rmdir(remotePath: string) {
      for (const key of Array.from(remoteFiles.keys())) {
        if (key === remotePath || key.startsWith(`${remotePath}/`)) remoteFiles.delete(key)
      }
    }
    async stat(remotePath: string) {
      const data = remoteFiles.get(remotePath)
      if (!data) throw new Error('not found')
      return { size: data.length }
    }
    get(remotePath: string, dst: NodeJS.WritableStream) {
      const data = remoteFiles.get(remotePath)
      return new Promise((resolve, reject) => {
        if (!data) {
          reject(new Error('not found'))
          return
        }
        dst.end(data)
        resolve(dst)
      })
    }
  },
}))

type Mod = typeof import('./product-images')
let m: Mod
beforeAll(async () => {
  m = await import('./product-images')
})

const U = '5ed395b8-c0ce-4eb1-8a4e-7b37fd887ad0'
const P = '5903d025-0686-4ccd-9cc6-6d38f79fe90e'
const OTHER = '11111111-2222-3333-4444-555555555555'
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0])
const file = (bytes: Uint8Array, name: string, type: string) => new File([new Uint8Array(bytes)], name, { type })
const remotePathFor = (userId: string, productId: string, fileName: string) =>
  `/remote/product-images/${userId}/${productId}/${fileName}`

describe('product image paths', () => {
  it('stores under ASSETS_DIR/products/{userId}/{productId}', () => {
    expect(m.productImageDir(U, P)).toBe(path.join(tmp, 'products', U, P))
  })
  it('parses valid stored URLs and rejects anything else', () => {
    expect(m.parseProductImagePath(`/assets/products/${U}/${P}/123-abc-shot.png`)).toEqual({ userId: U, productId: P, file: '123-abc-shot.png' })
    for (const bad of [
      `/assets/products/${U}/${P}/../../secret.png`,
      `/assets/products/${U}/${P}/shot.svg`,
      `/assets/products/${U}/${P}/.hidden.png`,
      `/assets/products/not-a-uuid/${P}/shot.png`,
      `/assets/products/${U}/${P}/sub/shot.png`,
      `/Uploads/shot.png`,
      `https://evil.example/shot.png`,
    ]) expect(m.parseProductImagePath(bad)).toBeNull()
  })
  it('never resolves a file outside the product folder', () => {
    expect(m.productImageFilePath(U, P, '../x.png')).toBeNull()
    expect(m.productImageFilePath(U, P, '..png')).toBeNull()
    expect(m.productImageFilePath('../../etc', P, 'x.png')).toBeNull()
  })
})

describe('image validation', () => {
  it('detects real image types from content', () => {
    expect(m.sniffImageType(PNG)).toBe('image/png')
    expect(m.sniffImageType(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe('image/jpeg')
    expect(m.sniffImageType(new TextEncoder().encode('GIF89a......'))).toBe('image/gif')
    expect(m.sniffImageType(new TextEncoder().encode('RIFF\0\0\0\0WEBPVP8 '))).toBe('image/webp')
    expect(m.sniffImageType(new TextEncoder().encode('<html><script>'))).toBeNull()
  })
  it('rejects a non-image renamed to .png and a mismatched extension', async () => {
    await expect(m.readValidatedImage(file(new TextEncoder().encode('<svg onload=alert(1)>'), 'x.png', 'image/png'))).rejects.toThrow(/valid PNG/)
    await expect(m.readValidatedImage(file(PNG, 'x.jpg', 'image/jpeg'))).rejects.toThrow(/valid JPG/)
    await expect(m.readValidatedImage(file(PNG, 'x.exe', 'application/octet-stream'))).rejects.toThrow(/supported image type/)
  })
  it('rejects files over 5MB', async () => {
    const big = new Uint8Array(m.MAX_IMAGE_BYTES + 1)
    big.set(PNG)
    await expect(m.readValidatedImage(file(big, 'big.png', 'image/png'))).rejects.toThrow(/larger than 5MB/)
  })
})

describe('storing and ownership', () => {
  it('writes unique, sanitised names to the remote product folder', async () => {
    const a = await m.saveProductImage(file(PNG, 'My Shot (1).PNG', 'image/png'), U, P)
    const b = await m.saveProductImage(file(PNG, 'My Shot (1).PNG', 'image/png'), U, P)
    expect(a).not.toBe(b)
    expect(a).toMatch(new RegExp(`^/assets/products/${U}/${P}/\\d+-[a-z0-9]+-my-shot-1\\.png$`))
    const parsed = m.parseProductImagePath(a)!
    expect(remoteFiles.has(remotePathFor(parsed.userId, parsed.productId, parsed.file))).toBe(true)
  })
  it("only accepts new images from the product's own folder", async () => {
    const mine = await m.saveProductImage(file(PNG, 'mine.png', 'image/png'), U, P)
    const theirs = await m.saveProductImage(file(PNG, 'theirs.png', 'image/png'), OTHER, OTHER)
    expect(m.resolveImageList([mine], [], { userId: U, productId: P })).toEqual({ ok: true, images: [mine] })
    expect(m.resolveImageList([theirs], [], { userId: U, productId: P }).ok).toBe(false)
    // Images the product already has (including legacy paths) are kept as-is.
    expect(m.resolveImageList(['/Uploads/old.png', mine], ['/Uploads/old.png'], { userId: U, productId: P }).ok).toBe(true)
  })
  it('deleting a product removes its whole remote folder', async () => {
    const gone = await m.saveProductImage(file(PNG, 'gone.png', 'image/png'), OTHER, P)
    const parsed = m.parseProductImagePath(gone)!
    expect(remoteFiles.has(remotePathFor(parsed.userId, parsed.productId, parsed.file))).toBe(true)
    await m.deleteProductImageDir(OTHER, P)
    expect(remoteFiles.has(remotePathFor(parsed.userId, parsed.productId, parsed.file))).toBe(false)
  })
})
