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
