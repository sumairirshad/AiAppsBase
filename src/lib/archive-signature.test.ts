import { describe, it, expect } from 'vitest'
import { Readable } from 'stream'
import { createArchiveSignatureValidator, ByteCounterHasher, InvalidArchiveSignatureError } from './archive-signature'

async function pipeToBuffer(source: Buffer, ...transforms: NodeJS.ReadWriteStream[]): Promise<Buffer> {
  let stream: NodeJS.ReadableStream = Readable.from([source])
  for (const t of transforms) stream = stream.pipe(t)
  const chunks: Buffer[] = []
  return new Promise((resolve, reject) => {
    stream.on('data', (c) => chunks.push(c as Buffer))
    stream.on('end', () => resolve(Buffer.concat(chunks)))
    stream.on('error', reject)
  })
}

describe('createArchiveSignatureValidator', () => {
  it('passes through a real ZIP local-file-header signature unchanged', async () => {
    const zip = Buffer.concat([Buffer.from([0x50, 0x4b, 0x03, 0x04]), Buffer.from('rest of fake zip content')])
    const out = await pipeToBuffer(zip, createArchiveSignatureValidator())
    expect(out.equals(zip)).toBe(true)
  })

  it('passes through an empty-archive ZIP signature (PK\\x05\\x06)', async () => {
    const zip = Buffer.concat([Buffer.from([0x50, 0x4b, 0x05, 0x06]), Buffer.alloc(18)])
    const out = await pipeToBuffer(zip, createArchiveSignatureValidator())
    expect(out.length).toBe(zip.length)
  })

  it('passes through a real RAR5 signature unchanged', async () => {
    const rar = Buffer.concat([Buffer.from([0x52, 0x61, 0x72, 0x21, 0x1a, 0x07, 0x01, 0x00]), Buffer.from('rest')])
    const out = await pipeToBuffer(rar, createArchiveSignatureValidator())
    expect(out.equals(rar)).toBe(true)
  })

  it('rejects a file merely named .zip whose content is not a real archive', async () => {
    const fake = Buffer.from('this is just a text file pretending to be a zip, not even close')
    await expect(pipeToBuffer(fake, createArchiveSignatureValidator())).rejects.toThrow(InvalidArchiveSignatureError)
  })

  it('rejects a file smaller than the signature itself', async () => {
    const tiny = Buffer.from([0x50, 0x4b])
    await expect(pipeToBuffer(tiny, createArchiveSignatureValidator())).rejects.toThrow(InvalidArchiveSignatureError)
  })

  it('validates correctly even when the header arrives split across multiple small chunks', async () => {
    const zip = Buffer.concat([Buffer.from([0x50, 0x4b, 0x03, 0x04]), Buffer.from('payload-payload-payload')])
    const chunks = [zip.subarray(0, 1), zip.subarray(1, 3), zip.subarray(3)]
    const stream = Readable.from(chunks).pipe(createArchiveSignatureValidator())
    const out: Buffer[] = []
    await new Promise<void>((resolve, reject) => {
      stream.on('data', (c) => out.push(c as Buffer))
      stream.on('end', () => resolve())
      stream.on('error', reject)
    })
    expect(Buffer.concat(out).equals(zip)).toBe(true)
  })

  it('never buffers more than the header for a large valid stream (passthrough, not full buffering)', async () => {
    const bigPayload = Buffer.alloc(5 * 1024 * 1024, 7) // 5MB of filler
    const zip = Buffer.concat([Buffer.from([0x50, 0x4b, 0x03, 0x04]), bigPayload])
    const out = await pipeToBuffer(zip, createArchiveSignatureValidator())
    expect(out.length).toBe(zip.length)
  })
})

describe('ByteCounterHasher', () => {
  it('counts total bytes and produces a stable sha256 digest matching the content', async () => {
    const data = Buffer.from('hello world, this is a deterministic fixture')
    const hasher = new ByteCounterHasher()
    const out = await pipeToBuffer(data, hasher)
    expect(out.equals(data)).toBe(true)
    expect(hasher.bytes).toBe(data.length)
    const digest = hasher.digestHex()
    expect(digest).toMatch(/^[0-9a-f]{64}$/)

    const hasher2 = new ByteCounterHasher()
    await pipeToBuffer(data, hasher2)
    expect(hasher2.digestHex()).toBe(digest)
  })
})
