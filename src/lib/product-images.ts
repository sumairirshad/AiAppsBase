import fs from 'fs'
import path from 'path'

import { query } from '@/lib/db'
import { isAllowedImageUpload, safeFileName } from '@/lib/upload-safety'

/** Shared rules for product screenshots (create + edit). */
export const MAX_PRODUCT_IMAGES = 8
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024
export const UPLOAD_DIR = path.join(process.cwd(), 'public', 'Uploads')

const UPLOAD_PATH_RE = /^\/Uploads\/([A-Za-z0-9][A-Za-z0-9._-]*)$/

/** The file name behind a "/Uploads/<file>" path we wrote, or null for anything else. */
export function uploadedFileName(p: string): string | null {
  const m = UPLOAD_PATH_RE.exec(p)
  return m && m[1] === path.basename(m[1]) ? m[1] : null
}

export class ImageUploadError extends Error {}

/** Validates and stores one uploaded image, returning its public path. */
export async function saveProductImage(file: File): Promise<string> {
  if (!isAllowedImageUpload(file.name, file.type)) {
    throw new ImageUploadError(`"${file.name}" isn't a supported image type. Use JPG, PNG, WEBP, or GIF.`)
  }
  if (file.size === 0) throw new ImageUploadError(`"${file.name}" is empty.`)
  if (file.size > MAX_IMAGE_BYTES) throw new ImageUploadError(`"${file.name}" is larger than 5MB.`)

  fs.mkdirSync(UPLOAD_DIR, { recursive: true })
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeFileName(file.name)}`
  fs.writeFileSync(path.join(UPLOAD_DIR, fileName), Buffer.from(await file.arrayBuffer()))
  return `/Uploads/${fileName}`
}

/**
 * Validates the image list submitted when editing a product. Each entry must
 * be either one of the product's current images (kept as stored) or a file
 * this app uploaded that exists on disk — so a client can't attach arbitrary
 * URLs or other paths. Duplicates are dropped and order is preserved.
 */
export function resolveImageList(
  requested: unknown,
  current: string[]
): { ok: true; images: string[] } | { ok: false; error: string } {
  if (!Array.isArray(requested) || requested.some((v) => typeof v !== 'string')) {
    return { ok: false, error: 'Invalid images list' }
  }
  const images = Array.from(new Set(requested as string[]))
  if (images.length > MAX_PRODUCT_IMAGES) {
    return { ok: false, error: `A product can have at most ${MAX_PRODUCT_IMAGES} images` }
  }
  for (const img of images) {
    if (current.includes(img)) continue
    const name = uploadedFileName(img)
    if (!name || !fs.existsSync(path.join(UPLOAD_DIR, name))) {
      return { ok: false, error: 'One of the images is invalid or no longer exists. Please re-upload it.' }
    }
  }
  return { ok: true, images }
}

/** Deletes uploaded files that were removed from a product, unless another product still uses them. */
export async function deleteUnusedUploads(paths: string[]): Promise<void> {
  for (const p of paths) {
    const name = uploadedFileName(p)
    if (!name) continue
    try {
      const inUse = await query('SELECT 1 FROM products WHERE $1 = ANY(screenshots) LIMIT 1', [p])
      if ((inUse.rowCount ?? 0) === 0) fs.rmSync(path.join(UPLOAD_DIR, name), { force: true })
    } catch (err) {
      console.error(`[product-images] could not clean up ${p}:`, (err as Error).message)
    }
  }
}
