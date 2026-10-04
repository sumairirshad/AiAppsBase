import { NextRequest, NextResponse } from 'next/server'

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

  try {
    // Validate all files first so one bad file doesn't leave the others half-stored.
    const validated: { buf: Buffer; name: string }[] = []
    for (const file of files) validated.push({ buf: await readValidatedImage(file), name: file.name })
    const paths = validated.map((img) => writeProductImage(img.buf, img.name, sellerId, productId))
    return NextResponse.json({ paths })
  } catch (err) {
    if (err instanceof ImageUploadError) return NextResponse.json({ error: err.message }, { status: 400 })
    console.error('[product images] upload failed:', (err as Error).message)
    return NextResponse.json({ error: 'Failed to upload images' }, { status: 500 })
  }
}
