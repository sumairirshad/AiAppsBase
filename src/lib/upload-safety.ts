import path from 'path'

const ALLOWED_IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif'])
const ALLOWED_IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
const ALLOWED_DELIVERABLE_EXTENSIONS = new Set(['.zip', '.rar'])

/**
 * Reduces an untrusted, user-supplied filename to a safe basename: drops any
 * directory component (blocks path traversal like `../../etc/passwd` or an
 * absolute path) and restricts what's left to a conservative character set,
 * so the result is always safe to join onto a server-controlled directory.
 */
export function safeFileName(originalName: string): string {
  const base = path.basename(originalName)
  const ext = path.extname(base).toLowerCase().replace(/[^a-z0-9.]/g, '')
  const rawStem = base.slice(0, base.length - path.extname(base).length)
  const stem = rawStem
    .replace(/[^a-zA-Z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
  return `${stem || 'file'}${ext}`
}

export function isAllowedImageUpload(fileName: string, mimeType?: string): boolean {
  const ext = path.extname(fileName).toLowerCase()
  if (!ALLOWED_IMAGE_EXTENSIONS.has(ext)) return false
  if (mimeType && !ALLOWED_IMAGE_MIME_TYPES.has(mimeType)) return false
  return true
}

export function isAllowedDeliverableUpload(fileName: string): boolean {
  return ALLOWED_DELIVERABLE_EXTENSIONS.has(path.extname(fileName).toLowerCase())
}
