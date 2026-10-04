import { NextRequest, NextResponse } from 'next/server'

import { query } from '@/lib/db'
import { getSessionUserId } from '@/lib/session'
import { ImageUploadError, MAX_PRODUCT_IMAGES, saveProductImage } from '@/lib/product-images'

/**
 * Uploads new images for a product being edited and returns their paths.
 * Doesn't change the product: the edit form sends the final image list
 * (kept + new, in order) with "Save changes" via PATCH /api/products/[id].
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getSessionUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const owned = await query('SELECT id FROM products WHERE id = $1 AND seller_id = $2', [params.id, userId])
  if ((owned.rowCount ?? 0) === 0) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

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
    const paths: string[] = []
    for (const file of files) paths.push(await saveProductImage(file))
    return NextResponse.json({ paths })
  } catch (err) {
    if (err instanceof ImageUploadError) return NextResponse.json({ error: err.message }, { status: 400 })
    console.error('[product images] upload failed:', (err as Error).message)
    return NextResponse.json({ error: 'Failed to upload images' }, { status: 500 })
  }
}
