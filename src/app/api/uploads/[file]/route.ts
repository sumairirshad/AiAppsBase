import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

/**
 * Serves seller-uploaded images from public/Uploads at request time.
 *
 * `next start` only serves files that were in public/ when the app was
 * built, so screenshots uploaded afterwards 404'd and products fell back to
 * the placeholder image. next.config.js rewrites /Uploads/:file here when no
 * build-time static file matches, so stored `/Uploads/...` paths keep working.
 */
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'Uploads')

// Same image types the upload route accepts (see lib/upload-safety.ts).
const CONTENT_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
}

export const dynamic = 'force-dynamic'

export async function GET(_req: Request, { params }: { params: { file: string } }) {
  const name = params.file
  const type = CONTENT_TYPES[path.extname(name).toLowerCase()]
  // Plain file names only — no directories, traversal or hidden files.
  if (!type || name !== path.basename(name) || name.startsWith('.')) {
    return new NextResponse('Not found', { status: 404 })
  }

  try {
    const data = await fs.readFile(path.join(UPLOAD_DIR, name))
    return new NextResponse(new Uint8Array(data), {
      headers: {
        'Content-Type': type,
        'X-Content-Type-Options': 'nosniff',
        // Upload names are timestamped and never overwritten.
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch {
    return new NextResponse('Not found', { status: 404 })
  }
}
