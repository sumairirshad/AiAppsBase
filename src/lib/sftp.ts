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
 * Uploads a product screenshot to the same SFTP storage deliverables use —
 * product images were previously written to local disk, which is lost on
 * every redeploy/restart on serverless hosting. fileName is expected to
 * already be unique (timestamp + random suffix), so unlike local writes this
 * doesn't use an exclusive/no-clobber flag; a same-millisecond, same-random
 * collision is astronomically unlikely, matching how uploadDeliverable
 * already behaves.
 *
 * Callers MUST upload a product's images one at a time (not via
 * Promise.all/concurrently): ssh2-sftp-client's recursive mkdir does a
 * non-atomic "does this exist? no -> create it" check (see its _mkdir), so
 * two calls racing to create the same new {userId}/{productId} folder at
 * once can have one of them fail with a server-side "already exists" error
 * that the library does not treat as success. The catch below is a second,
 * defensive layer on top of that — it only protects against that one race
 * on mkdir itself, not against concurrent callers in general.
 */
export async function uploadProductImage(
  buffer: Buffer,
  userId: string,
  productId: string,
  fileName: string,
  correlationId?: string
): Promise<void> {
  const { remoteDir, ...connectConfig } = sftpConfig()
  const client = new SftpClient()
  const dir = productImageRemoteDir(remoteDir, userId, productId)
  const remotePath = `${dir}/${fileName}`
  const fields = { correlationId, userId, productId, fileName, size: buffer.length, remotePath }

  logUploadEvent('start', fields)

  try {
    await client.connect(connectConfig)

    try {
      await client.mkdir(dir, true)
      logUploadEvent('mkdir-ok', fields)
    } catch (err) {
      // Another upload for this same product may have created the
      // directory a moment ago — that's success, not a failure to surface.
      if (err instanceof Error && /already exists/i.test(err.message)) {
        logUploadEvent('mkdir-already-exists', fields)
      } else {
        logUploadError('mkdir-failed', fields, err)
        throw err
      }
    }

    await client.put(buffer, remotePath)
    logUploadEvent('put-ok', fields)
  } catch (err) {
    logUploadError('upload-failed', fields, err)
    throw err
  } finally {
    await client.end().catch(() => {})
  }
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
