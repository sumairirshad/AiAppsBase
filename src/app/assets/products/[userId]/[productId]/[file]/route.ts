import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

import { IMAGE_CONTENT_TYPES, productImageFilePath } from '@/lib/product-images'

/**
 * Serves product images from assets/products/{userId}/{productId}/{file}.
 * Every segment is validated (UUIDs + a safe image file name), so requests
 * can't escape the product's folder or read anything that isn't an image.
 */
export const dynamic = 'force-dynamic'

export async function GET(
  _req: Request,
  { params }: { params: { userId: string; productId: string; file: string } }
) {
  const filePath = productImageFilePath(params.userId, params.productId, params.file)
  if (!filePath) return new NextResponse('Not found', { status: 404 })

  try {
    const data = await fs.readFile(filePath)
    return new NextResponse(new Uint8Array(data), {
      headers: {
        'Content-Type': IMAGE_CONTENT_TYPES[path.extname(filePath).toLowerCase()],
        'X-Content-Type-Options': 'nosniff',
        // File names are unique and never overwritten, so they can be cached forever.
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch {
    return new NextResponse('Not found', { status: 404 })
  }
}
