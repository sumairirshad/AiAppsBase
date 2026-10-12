import SftpClient from 'ssh2-sftp-client'
import { PassThrough } from 'stream'
import { safeFileName } from '@/lib/upload-safety'

/**
 * Structured, single-line diagnostics for product-image uploads. Deliberately
 * never logs SFTP_HOST/USERNAME/PASSWORD or file bytes — only the remote path
 * (not a secret, just a directory layout), filename, size, and outcome. A
 * `correlationId` is threaded through from the API route so every line for
 * one product-creation request can be grepped together.
 */
function logUploadEvent(event: string, fields: Record<string, unknown>) {
  console.log(`[sftp:product-image] ${event}`, JSON.stringify(fields))
}

function logUploadError(event: string, fields: Record<string, unknown>, err: unknown) {
  const e = err instanceof Error ? err : new Error(String(err))
  console.error(`[sftp:product-image] ${event}`, JSON.stringify(fields), {
    errorName: e.name,
    errorMessage: e.message,
    stack: e.stack,
  })
}

function sftpConfig() {
  const host = process.env.SFTP_HOST
  const username = process.env.SFTP_USERNAME
  const password = process.env.SFTP_PASSWORD
  const remoteDir = process.env.SFTP_REMOTE_DIR

  if (!host || !username || !password || !remoteDir) {
    throw new Error('SFTP is not configured. Set SFTP_HOST, SFTP_USERNAME, SFTP_PASSWORD, SFTP_REMOTE_DIR.')
  }

  return {
    host,
    port: Number(process.env.SFTP_PORT) || 22,
    username,
    password,
    remoteDir,
  }
}

export async function uploadDeliverable(
  buffer: Buffer,
  productId: string,
  originalFileName: string
): Promise<{ remotePath: string }> {
  const { remoteDir, ...connectConfig } = sftpConfig()
  const client = new SftpClient()

  try {
    await client.connect(connectConfig)

    const dir = `${remoteDir}/${productId}`
    await client.mkdir(dir, true)

    const fileName = `${Date.now()}-${safeFileName(originalFileName)}`
    const remotePath = `${dir}/${fileName}`

    await client.put(buffer, remotePath)

    return { remotePath }
  } finally {
    await client.end().catch(() => {})
  }
}

export async function deleteDeliverable(remotePath: string): Promise<void> {
  const { remoteDir: _remoteDir, ...connectConfig } = sftpConfig()
  const client = new SftpClient()

  try {
    await client.connect(connectConfig)
    await client.delete(remotePath)
  } finally {
    await client.end().catch(() => {})
  }
}

function productImageRemoteDir(remoteDir: string, userId: string, productId: string): string {
  return `${remoteDir}/product-images/${userId}/${productId}`
}

/**
 * Races `op` against this connection's underlying transport dying.
 *
 * ssh2-sftp-client's constructor wires its OWN "error"/"end"/"close"
 * listeners onto the raw ssh2 Client first (they just log, e.g. "Global
 * error listener: ..."), and marks the event handled before any
 * operation-specific listener added later (by connect/mkdir/put internally)
 * gets a chance to run — so when the connection drops mid-operation (e.g. a
 * "read ECONNRESET" from a flaky SFTP server), the library's own
 * operation-specific rejection can be skipped and the pending promise is
 * left neither resolved nor rejected. It just hangs until something else
 * times it out.
 *
 * This attaches an independent "error" listener that isn't part of that
 * internal handshake, so it still fires and fails `op` immediately and with
 * the real error, however the library's own bookkeeping behaves.
 */
function guardAgainstDroppedConnection(client: SftpClient) {
  let activeReject: ((err: Error) => void) | null = null

  client.on('error', (err: Error) => {
    activeReject?.(err instanceof Error ? err : new Error(String(err)))
  })

  return function guard<T>(op: Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      activeReject = reject
      op.then(
        (v) => { activeReject = null; resolve(v) },
        (e) => { activeReject = null; reject(e) }
      )
    })
  }
}

async function mkdirTolerant(client: SftpClient, dir: string, fields: Record<string, unknown>): Promise<void> {
  try {
    await client.mkdir(dir, true)
    logUploadEvent('mkdir-ok', fields)
  } catch (err) {
    // A previous upload (or, before uploads were serialized onto one
    // connection per product, a concurrent one) may have created the
    // directory a moment ago — that's success, not a failure to surface.
    if (err instanceof Error && /already exists/i.test(err.message)) {
      logUploadEvent('mkdir-already-exists', fields)
    } else {
      logUploadError('mkdir-failed', fields, err)
      throw err
    }
  }
}

/**
 * Uploads every screenshot for one product over a SINGLE SFTP connection.
 *
 * This used to open one connection per image. Reconnecting — a fresh TCP +
 * SSH handshake — several times back to back for one product request is
 * what triggered repeated "read ECONNRESET" drops against a real Windows
 * OpenSSH SFTP server: each drop silently stranded that image's upload
 * (see guardAgainstDroppedConnection above) instead of failing it cleanly,
 * and the handshake overhead of N reconnects is also just slow. Uploading a
 * product's images over one connection removes the repeated-handshake
 * trigger, and also removes the mkdir race from N connections independently
 * creating the same new directory — there's only one connection now, and
 * uploads happen on it in order.
 *
 * fileName is expected to already be unique per file (timestamp + random
 * suffix), so this doesn't use an exclusive/no-clobber flag; a
 * same-millisecond, same-random collision is astronomically unlikely,
 * matching how uploadDeliverable already behaves.
 */
export async function uploadProductImages(
  userId: string,
  productId: string,
  files: { buffer: Buffer; fileName: string }[],
  correlationId?: string
): Promise<void> {
  const { remoteDir, ...connectConfig } = sftpConfig()
  const client = new SftpClient()
  const dir = productImageRemoteDir(remoteDir, userId, productId)
  const baseFields = { correlationId, userId, productId, remotePath: dir, fileCount: files.length }
  const guard = guardAgainstDroppedConnection(client)

  logUploadEvent('batch-start', baseFields)

  try {
    await guard(client.connect(connectConfig))
    await guard((async () => {
      await mkdirTolerant(client, dir, baseFields)
      for (const { buffer, fileName } of files) {
        const fields = { ...baseFields, fileName, size: buffer.length, remotePath: `${dir}/${fileName}` }
        logUploadEvent('start', fields)
        await client.put(buffer, fields.remotePath)
        logUploadEvent('put-ok', fields)
      }
    })())
    logUploadEvent('batch-ok', baseFields)
  } catch (err) {
    logUploadError('batch-failed', baseFields, err)
    throw err
  } finally {
    await client.end().catch(() => {})
  }
}

/** Single-image convenience wrapper around {@link uploadProductImages}. */
export async function uploadProductImage(
  buffer: Buffer,
  userId: string,
  productId: string,
  fileName: string,
  correlationId?: string
): Promise<void> {
  await uploadProductImages(userId, productId, [{ buffer, fileName }], correlationId)
}

export async function deleteProductImage(userId: string, productId: string, fileName: string): Promise<void> {
  const { remoteDir, ...connectConfig } = sftpConfig()
  const client = new SftpClient()

  try {
    await client.connect(connectConfig)
    await client.delete(`${productImageRemoteDir(remoteDir, userId, productId)}/${fileName}`)
  } finally {
    await client.end().catch(() => {})
  }
}

/** Removes a product's whole image folder (after the product is deleted, or a failed create). */
export async function deleteProductImageDir(userId: string, productId: string): Promise<void> {
  const { remoteDir, ...connectConfig } = sftpConfig()
  const client = new SftpClient()

  try {
    await client.connect(connectConfig)
    await client.rmdir(productImageRemoteDir(remoteDir, userId, productId), true)
  } finally {
    await client.end().catch(() => {})
  }
}

export async function downloadProductImageStream(
  userId: string,
  productId: string,
  fileName: string
): Promise<{ stream: NodeJS.ReadableStream; size?: number }> {
  const { remoteDir, ...connectConfig } = sftpConfig()
  const client = new SftpClient()
  await client.connect(connectConfig)

  const remotePath = `${productImageRemoteDir(remoteDir, userId, productId)}/${fileName}`

  let size: number | undefined
  try {
    const stat = await client.stat(remotePath)
    size = stat.size
  } catch {
    // fall through without a known size — Content-Length just won't be set
  }

  const passThrough = new PassThrough()

  client
    .get(remotePath, passThrough)
    .catch((err: Error) => passThrough.destroy(err))
    .finally(() => client.end().catch(() => {}))

  return { stream: passThrough, size }
}

export async function downloadDeliverableStream(
  remotePath: string
): Promise<{ stream: NodeJS.ReadableStream; size?: number }> {
  const { remoteDir: _remoteDir, ...connectConfig } = sftpConfig()
  const client = new SftpClient()

  await client.connect(connectConfig)

  let size: number | undefined
  try {
    const stat = await client.stat(remotePath)
    size = stat.size
  } catch {
    // fall through without a known size — Content-Length just won't be set
  }

  const passThrough = new PassThrough()

  client
    .get(remotePath, passThrough)
    .catch((err: Error) => passThrough.destroy(err))
    .finally(() => client.end().catch(() => {}))

  return { stream: passThrough, size }
}
