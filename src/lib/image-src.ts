/**
 * Turns a stored image path into a URL that works from any page. Uploads are
 * saved as "/Uploads/<file>", but paths assigned by hand or via SQL often
 * aren't root-relative ("Uploads/x.png", "public/Uploads/x.png",
 * "\\Uploads\\x.png"). A relative path resolves against the current page —
 * fine on /products, but /product/<slug> requests /product/Uploads/x.png, gets
 * a 404 and shows the fallback even though the image exists.
 */
export function normalizeImageSrc(src?: string | null): string | null {
  if (!src) return null
  let s = String(src).trim().replace(/\\/g, '/')
  if (!s) return null
  if (/^(https?:)?\/\//i.test(s) || /^(data|blob):/i.test(s)) return s
  s = s.replace(/^(\.\/)+/, '').replace(/^\/?public\//i, '/')
  return s.startsWith('/') ? s : `/${s}`
}
