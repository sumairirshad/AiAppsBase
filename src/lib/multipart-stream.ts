import Busboy from 'busboy'
import { Readable } from 'stream'
import type { NextRequest } from 'next/server'

/**
 * Parses one multipart/form-data request without buffering the whole body
 * into memory first.
 *
 * req.formData() (used elsewhere in this app for screenshots and small
 * fields) is simple, but Next.js has to fully buffer the entire request
 * body before it can return anything from it — fine for a few MB of images,
 * fatal for an arbitrarily large deliverable ZIP (the whole point of
 * removing the app-level size cap is defeated if every upload still has to
 * fit in server memory first). This reads the request's raw body stream
 * with Busboy instead, so the file field's bytes are handed to `onFile` as
 * they arrive off the network — `onFile` is expected to pipe/stream them
 * onward (e.g. straight into the SFTP upload) rather than collect them.
 *
 * Non-file fields (version string, release notes, checkboxes, ...) are
 * small by nature and are collected into `fields` as usual.
 *
 * Only one file field is accepted (`fileFieldName`); any other file part is
 * drained and discarded so Busboy doesn't stall waiting for it to be read.
 */
export async function receiveMultipartUpload(
  req: NextRequest,
  fileFieldName: string,
  onFile: (filename: string, mimeType: string, stream: Readable) => Promise<void>
): Promise<{ fields: Record<string, string>; fileReceived: boolean }> {
  const contentType = req.headers.get('content-type') || ''
  if (!contentType.toLowerCase().includes('multipart/form-data')) {
    throw new Error('Expected a multipart/form-data request')
  }
  if (!req.body) {
    throw new Error('Request has no body')
  }

  const fields: Record<string, string> = {}
  let fileReceived = false
  let fileHandlingError: Error | null = null

  await new Promise<void>((resolve, reject) => {
    const bb = Busboy({ headers: { 'content-type': contentType } })
    let pendingFilePromise: Promise<void> | null = null
    let settled = false

    const fail = (err: unknown) => {
      if (settled) return
      settled = true
      reject(err instanceof Error ? err : new Error(String(err)))
    }

    bb.on('field', (name: string, value: string) => {
      fields[name] = value
    })

    bb.on('file', (name: string, stream: Readable, info: { filename: string; mimeType: string }) => {
      if (name !== fileFieldName || fileReceived) {
        // Not the field we're after (or a duplicate) — drain it so parsing
        // can continue instead of stalling on an unread stream.
        stream.resume()
        return
      }
      fileReceived = true
      pendingFilePromise = onFile(info.filename, info.mimeType, stream).catch((err) => {
        fileHandlingError = err instanceof Error ? err : new Error(String(err))
        // onFile gave up without necessarily consuming the whole stream
        // (e.g. it rejected after a validation failure) — drain whatever's
        // left so Busboy's 'close' still fires instead of hanging forever.
        stream.resume()
      })
    })

    bb.on('error', fail)

    bb.on('close', () => {
      if (settled) return
      settled = true
      if (pendingFilePromise) {
        pendingFilePromise.finally(resolve)
      } else {
        resolve()
      }
    })

    const nodeReadable = Readable.fromWeb(req.body as unknown as import('stream/web').ReadableStream)
    nodeReadable.on('error', fail)
    nodeReadable.pipe(bb)
  })

  if (fileHandlingError) throw fileHandlingError
  return { fields, fileReceived }
}
