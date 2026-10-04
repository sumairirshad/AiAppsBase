import fs from 'fs'
import path from 'path'

import { query } from '@/lib/db'
import { isAllowedImageUpload, safeFileName } from '@/lib/upload-safety'

/**
 * Product image storage.
 *
 * Files live outside public/ at
 *   <ASSETS_DIR or ./assets>/products/{userId}/{productId}/{timestamp}-{random}-{name}.{ext}
 * and are served by app/assets/products/[userId]/[productId]/[file]/route.ts at
 *   /assets/products/{userId}/{productId}/{file}
 * which is the path stored in products.screenshots.
 *
 * Images uploaded before this layout ("/Uploads/<file>" in public/Uploads)
 * keep working; they're only cleaned up, never rewritten.
 */
export const MAX_PRODUCT_IMAGES = 8
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024

export const ASSETS_ROOT = process.env.ASSETS_DIR ? path.resolve(process.env.ASSETS_DIR) : path.join(process.cwd(), 'assets')
export const PRODUCT_ASSETS_DIR = path.join(ASSETS_ROOT, 'products')
export const PRODUCT_IMAGE_URL_PREFIX = '/assets/products/'

/** Legacy flat upload folder (public/Uploads). */
export const LEGACY_UPLOAD_DIR = path.join(process.cwd(), 'public', 'Uploads')

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const STORED_FILE_RE = /^[A-Za-z0-9][A-Za-z0-9._-]{0,180}$/
const LEGACY_PATH_RE = /^\/Uploads\/([A-Za-z0-9][A-Za-z0-9._-]*)$/

export const IMAGE_CONTENT_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
}

export class ImageUploadError extends Error {}

const isId = (v: string) => UUID_RE.test(v)
const isStoredFileName = (v: string) =>
  STORED_FILE_RE.test(v) && v === path.basename(v) && !v.includes('..') && Boolean(IMAGE_CONTENT_TYPES[path.extname(v).toLowerCase()])

/** Absolute folder for one product's images. Throws for anything that isn't a pair of UUIDs. */
export function productImageDir(userId: string, productId: string): string {
  if (!isId(userId) || !isId(productId)) throw new Error('Invalid user or product id')
  return path.join(PRODUCT_ASSETS_DIR, userId.toLowerCase(), productId.toLowerCase())
}

/** Absolute file path for a stored product image, or null if any segment is invalid. */
export function productImageFilePath(userId: string, productId: string, file: string): string | null {
  if (!isId(userId) || !isId(productId) || !isStoredFileName(file)) return null
  const full = path.join(productImageDir(userId, productId), file)
  // Defence in depth: the resolved file must stay inside the product's folder.
  return path.dirname(full) === productImageDir(userId, productId) ? full : null
}

/** Splits a stored "/assets/products/{userId}/{productId}/{file}" URL, or returns null. */
export function parseProductImagePath(p: string): { userId: string; productId: string; file: string } | null {
  if (typeof p !== 'string' || !p.startsWith(PRODUCT_IMAGE_URL_PREFIX)) return null
  const parts = p.slice(PRODUCT_IMAGE_URL_PREFIX.length).split('/')
  if (parts.length !== 3) return null
  const [userId, productId, file] = parts
  return productImageFilePath(userId, productId, file) ? { userId, productId, file } : null
}

/** The file name behind a legacy "/Uploads/<file>" path, or null for anything else. */
export function legacyUploadFileName(p: string): string | null {
  const m = LEGACY_PATH_RE.exec(p)
  return m && m[1] === path.basename(m[1]) ? m[1] : null
}

/** Real image type from the file's first bytes (not its name or the browser's claim). */
export function sniffImageType(buf: Uint8Array): 'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp' | null {
  const ascii = (start: number, end: number) => String.fromCharCode(...Array.from(buf.subarray(start, end)))
  if (buf.length >= 8 && buf[0] === 0x89 && ascii(1, 4) === 'PNG' && buf[4] === 0x0d && buf[5] === 0x0a && buf[6] === 0x1a && buf[7] === 0x0a) return 'image/png'
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg'
  if (buf.length >= 6 && (ascii(0, 6) === 'GIF87a' || ascii(0, 6) === 'GIF89a')) return 'image/gif'
  if (buf.length >= 12 && ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'image/webp'
  return null
}

/**
 * Checks an uploaded file (extension, declared type, size, and actual
 * content) and returns its bytes. Throws ImageUploadError with a message
 * suitable for the user.
 */
export async function readValidatedImage(file: File): Promise<Buffer> {
  if (!isAllowedImageUpload(file.name, file.type)) {
    throw new ImageUploadError(`"${file.name}" isn't a supported image type. Use JPG, PNG, WEBP, or GIF.`)
  }
  if (file.size === 0) throw new ImageUploadError(`"${file.name}" is empty.`)
  if (file.size > MAX_IMAGE_BYTES) throw new ImageUploadError(`"${file.name}" is larger than 5MB.`)
  const buf = Buffer.from(await file.arrayBuffer())
  const actual = sniffImageType(buf)
  const expected = IMAGE_CONTENT_TYPES[path.extname(file.name).toLowerCase()]
  if (!actual || actual !== expected) {
    throw new ImageUploadError(`"${file.name}" isn't a valid ${path.extname(file.name).slice(1).toUpperCase()} image.`)
  }
  return buf
}

/**
 * Stores an already-validated image in the product's folder and returns its
 * public URL. Names are timestamped + random and written with the "wx" flag,
 * so an existing file is never overwritten.
 */
export function writeProductImage(buf: Buffer, originalName: string, userId: string, productId: string): string {
  const dir = productImageDir(userId, productId)
  fs.mkdirSync(dir, { recursive: true })
  const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeFileName(originalName)}`.toLowerCase()
  fs.writeFileSync(path.join(dir, name), buf, { flag: 'wx' })
  return `${PRODUCT_IMAGE_URL_PREFIX}${userId.toLowerCase()}/${productId.toLowerCase()}/${name}`
}

/** Validate + store in one step. */
export async function saveProductImage(file: File, userId: string, productId: string): Promise<string> {
  return writeProductImage(await readValidatedImage(file), file.name, userId, productId)
}

/**
 * Validates the image list submitted when editing a product. Each entry must
 * be one of the product's current images (kept as stored) or an image that
 * exists in THIS product's folder — never another product's or user's files,
 * or arbitrary paths/URLs. Duplicates are dropped; order is preserved.
 */
export function resolveImageList(
  requested: unknown,
  current: string[],
  owner: { userId: string; productId: string }
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
    const parsed = parseProductImagePath(img)
    const ownsIt =
      parsed &&
      parsed.userId.toLowerCase() === owner.userId.toLowerCase() &&
      parsed.productId.toLowerCase() === owner.productId.toLowerCase()
    const file = ownsIt ? productImageFilePath(parsed.userId, parsed.productId, parsed.file) : null
    if (!file || !fs.existsSync(file)) {
      return { ok: false, error: 'One of the images is invalid or no longer exists. Please re-upload it.' }
    }
  }
  return { ok: true, images }
}

/**
 * Deletes image files that were removed from a product. Product-folder files
 * belong to one product and are removed directly; legacy /Uploads files are
 * only removed if no other product still references them.
 */
export async function deleteRemovedImages(paths: string[]): Promise<void> {
  for (const p of paths) {
    try {
      const parsed = parseProductImagePath(p)
      if (parsed) {
        const file = productImageFilePath(parsed.userId, parsed.productId, parsed.file)
        if (file) fs.rmSync(file, { force: true })
        continue
      }
      const legacy = legacyUploadFileName(p)
      if (!legacy) continue
      const inUse = await query('SELECT 1 FROM products WHERE $1 = ANY(screenshots) LIMIT 1', [p])
      if ((inUse.rowCount ?? 0) === 0) fs.rmSync(path.join(LEGACY_UPLOAD_DIR, legacy), { force: true })
    } catch (err) {
      console.error(`[product-images] could not clean up ${p}:`, (err as Error).message)
    }
  }
}

/** Removes a product's whole image folder (after the product is deleted, or a failed create). */
export function deleteProductImageDir(userId: string, productId: string): void {
  try {
    fs.rmSync(productImageDir(userId, productId), { recursive: true, force: true })
    // Tidy the user's folder if this was their last product with images.
    const userDir = path.dirname(productImageDir(userId, productId))
    if (fs.existsSync(userDir) && fs.readdirSync(userDir).length === 0) fs.rmdirSync(userDir)
  } catch (err) {
    console.error(`[product-images] could not remove images for product ${productId}:`, (err as Error).message)
  }
}
