import SftpClient from 'ssh2-sftp-client'
import { PassThrough } from 'stream'
import { safeFileName } from '@/lib/upload-safety'

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
 */
export async function uploadProductImage(
  buffer: Buffer,
  userId: string,
  productId: string,
  fileName: string
): Promise<void> {
  const { remoteDir, ...connectConfig } = sftpConfig()
  const client = new SftpClient()

  try {
    await client.connect(connectConfig)
    const dir = productImageRemoteDir(remoteDir, userId, productId)
    await client.mkdir(dir, true)
    await client.put(buffer, `${dir}/${fileName}`)
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
