import { NextRequest, NextResponse } from 'next/server'
import { Readable } from 'stream'
import fs from 'fs/promises'
import path from 'path'

import { IMAGE_CONTENT_TYPES, productImageFilePath } from '@/lib/product-images'
import { downloadProductImageStream } from '@/lib/sftp'

/**
 * Serves product images at /assets/products/{userId}/{productId}/{file}.
 * Every segment is validated (UUIDs + a safe image file name) before
 * anything is requested, so a request can't escape the product's folder or
 * fetch anything that isn't an image.
 *
 * New uploads live on the SFTP server (src/lib/sftp.ts), tried first. Images
 * saved before that move are still on local disk under
 * ASSETS_DIR/products/{userId}/{productId}/{file} and were never copied to
 * SFTP, so this falls back to reading them locally — without it, every
 * pre-migration image 404s even though products.screenshots still points
 * straight at it.
 */
export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: { userId: string; productId: string; file: string } }
) {
  const filePath = productImageFilePath(params.userId, params.productId, params.file)
  if (!filePath) return new NextResponse('Not found', { status: 404 })

  const headers: Record<string, string> = {
    'Content-Type': IMAGE_CONTENT_TYPES[path.extname(params.file).toLowerCase()],
    'X-Content-Type-Options': 'nosniff',
    // File names are unique and never overwritten, so they can be cached forever.
    'Cache-Control': 'public, max-age=31536000, immutable',
  }

  try {
    const { stream, size } = await downloadProductImageStream(params.userId, params.productId, params.file)
    const webStream = Readable.toWeb(stream as Readable) as ReadableStream
    if (size) headers['Content-Length'] = String(size)
    return new NextResponse(webStream, { headers })
  } catch (err) {
    console.error('[assets/products] SFTP fetch failed, falling back to local disk:', params.userId, params.productId, params.file, (err as Error).message)
  }

  try {
    const data = await fs.readFile(filePath)
    return new NextResponse(new Uint8Array(data), { headers })
  } catch {
    return new NextResponse('Not found', { status: 404 })
  }
}
