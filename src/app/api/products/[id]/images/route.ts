import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

import { query } from '@/lib/db'
import { getSessionUserId } from '@/lib/session'
import { ImageUploadError, MAX_PRODUCT_IMAGES, readValidatedImage, writeProductImage } from '@/lib/product-images'

/**
 * Uploads new images for a product being edited into
 * assets/products/{sellerId}/{productId}/ and returns their URLs.
 * Doesn't change the product: the edit form sends the final image list
 * (kept + new, in order) with "Save changes" via PATCH /api/products/[id].
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getSessionUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const owned = await query('SELECT id, seller_id FROM products WHERE id = $1 AND seller_id = $2', [params.id, userId])
  if ((owned.rowCount ?? 0) === 0) return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  const { id: productId, seller_id: sellerId } = owned.rows[0]

  let files: File[]
  try {
    files = (await req.formData()).getAll('images').filter((f): f is File => typeof f !== 'string')
  } catch {
    return NextResponse.json({ error: 'Invalid upload' }, { status: 400 })
  }
  if (files.length === 0) return NextResponse.json({ error: 'No images were uploaded' }, { status: 400 })
  if (files.length > MAX_PRODUCT_IMAGES) {
    return NextResponse.json({ error: `You can upload at most ${MAX_PRODUCT_IMAGES} images` }, { status: 400 })
  }

  const correlationId = randomUUID()

  try {
    // Validate all files first so one bad file doesn't leave the others half-stored.
    const validated: { buf: Buffer; name: string }[] = []
    for (const file of files) validated.push({ buf: await readValidatedImage(file), name: file.name })

    // One at a time, not Promise.all: concurrent uploads for the same
    // product race to create the same new {sellerId}/{productId} SFTP
    // folder (ssh2-sftp-client's recursive mkdir isn't atomic), which can
    // fail one of them with a spurious "already exists" error. See the
    // longer note in src/app/api/products/route.ts.
    const paths: string[] = []
    for (const img of validated) paths.push(await writeProductImage(img.buf, img.name, sellerId, productId, correlationId))
    return NextResponse.json({ paths })
  } catch (err) {
    if (err instanceof ImageUploadError) return NextResponse.json({ error: err.message }, { status: 400 })
    const error = err instanceof Error ? err : new Error(String(err))
    console.error('[product images] upload failed:', { correlationId, sellerId, productId, errorName: error.name, errorMessage: error.message }, error)
    const detail = process.env.NODE_ENV !== 'production' ? error.message : undefined
    return NextResponse.json({ error: 'Failed to upload images', ...(detail ? { detail } : {}) }, { status: 500 })
  }
}
