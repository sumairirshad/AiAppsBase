import { NextRequest, NextResponse } from 'next/server'
import { Readable } from 'stream'
import path from 'path'

import { IMAGE_CONTENT_TYPES, productImageFilePath } from '@/lib/product-images'
import { downloadProductImageStream } from '@/lib/sftp'

/**
 * Serves product images by streaming them from the SFTP server at
 * product-images/{userId}/{productId}/{file}. Every segment is validated
 * (UUIDs + a safe image file name) before anything is requested, so a
 * request can't escape the product's folder or fetch anything that isn't
 * an image.
 */
export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: { userId: string; productId: string; file: string } }
) {
  if (!productImageFilePath(params.userId, params.productId, params.file)) {
    return new NextResponse('Not found', { status: 404 })
  }

  try {
    const { stream, size } = await downloadProductImageStream(params.userId, params.productId, params.file)
    const webStream = Readable.toWeb(stream as Readable) as ReadableStream

    const headers: Record<string, string> = {
      'Content-Type': IMAGE_CONTENT_TYPES[path.extname(params.file).toLowerCase()],
      'X-Content-Type-Options': 'nosniff',
      // File names are unique and never overwritten, so they can be cached forever.
      'Cache-Control': 'public, max-age=31536000, immutable',
    }
    if (size) headers['Content-Length'] = String(size)

    return new NextResponse(webStream, { headers })
  } catch (err) {
    console.error('[assets/products] SFTP fetch failed:', params.userId, params.productId, params.file, err)
    return new NextResponse('Not found', { status: 404 })
  }
}
