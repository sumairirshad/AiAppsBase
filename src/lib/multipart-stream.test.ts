import { describe, it, expect } from 'vitest'
import { Readable } from 'stream'
import { receiveMultipartUpload } from './multipart-stream'

/** Builds a real multipart/form-data Request the way a browser's fetch(FormData) would. */
function buildMultipartRequest(fields: Record<string, string>, file?: { fieldName: string; filename: string; content: Buffer; type?: string }): Request {
  const form = new FormData()
  for (const [k, v] of Object.entries(fields)) form.append(k, v)
  if (file) {
    form.append(file.fieldName, new Blob([new Uint8Array(file.content)], { type: file.type ?? 'application/octet-stream' }), file.filename)
  }
  return new Request('http://localhost/test', { method: 'POST', body: form })
}

async function drain(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = []
  for await (const chunk of stream) chunks.push(chunk as Buffer)
  return Buffer.concat(chunks)
}

describe('receiveMultipartUpload', () => {
  it('collects text fields and streams the file field content without buffering it beforehand', async () => {
    const payload = Buffer.from('a'.repeat(200_000)) // large enough to arrive over multiple chunks
    const req = buildMultipartRequest(
      { version: '1.2.0', notifyBuyers: 'true' },
      { fieldName: 'deliverableFile', filename: 'app.zip', content: payload }
    )

    let receivedName = ''
    const receivedRef: { bytes: Buffer | null } = { bytes: null }
    const { fields, fileReceived } = await receiveMultipartUpload(req as any, 'deliverableFile', async (filename, _mime, stream) => {
      receivedName = filename
      receivedRef.bytes = await drain(stream)
    })

    expect(fields.version).toBe('1.2.0')
    expect(fields.notifyBuyers).toBe('true')
    expect(fileReceived).toBe(true)
    expect(receivedName).toBe('app.zip')
    expect(receivedRef.bytes?.equals(payload)).toBe(true)
  })

  it('reports fileReceived: false when no file field was sent', async () => {
    const req = buildMultipartRequest({ version: '1.0.0' })
    const { fileReceived } = await receiveMultipartUpload(req as any, 'deliverableFile', async () => {})
    expect(fileReceived).toBe(false)
  })

  it('drains and ignores a file sent under an unexpected field name instead of hanging', async () => {
    const req = buildMultipartRequest({}, { fieldName: 'somethingElse', filename: 'x.zip', content: Buffer.from('x') })
    const { fileReceived } = await receiveMultipartUpload(req as any, 'deliverableFile', async () => {
      throw new Error('should never be called for the wrong field')
    })
    expect(fileReceived).toBe(false)
  })

  it('propagates an error thrown inside onFile back to the caller', async () => {
    const req = buildMultipartRequest(
      { version: '1.0.0' },
      { fieldName: 'deliverableFile', filename: 'bad.zip', content: Buffer.from('not actually a zip') }
    )
    await expect(
      receiveMultipartUpload(req as any, 'deliverableFile', async () => {
        throw new Error('simulated validation failure')
      })
    ).rejects.toThrow('simulated validation failure')
  })

  it('rejects a non-multipart request', async () => {
    const req = new Request('http://localhost/test', { method: 'POST', body: JSON.stringify({ a: 1 }), headers: { 'content-type': 'application/json' } })
    await expect(receiveMultipartUpload(req as any, 'deliverableFile', async () => {})).rejects.toThrow(/multipart/i)
  })
})
