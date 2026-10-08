/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: 'localhost' },
    ],
    formats: ['image/avif', 'image/webp'],
    // Optimized product images are keyed by an immutable, never-overwritten
    // filename (see lib/product-images.ts), so there's nothing to invalidate.
    // The Next.js default (60s) would force a full re-optimize of every image
    // size/format combination roughly once a minute; a long TTL here lets the
    // same optimized output actually stay cached and be served instantly.
    minimumCacheTTL: 31536000,
  },
  // Seller uploads are written to public/Uploads at runtime, but the production
  // server only serves public/ files that existed at build time. Any
  // /Uploads/... request without a matching static file is served from disk
  // by app/api/uploads/[file] instead (afterFiles = only after static files).
  async rewrites() {
    return {
      afterFiles: [{ source: '/Uploads/:file', destination: '/api/uploads/:file' }],
    }
  },
  experimental: {
    serverComponentsExternalPackages: ['ssh2-sftp-client', 'ssh2'],
  },
}

module.exports = nextConfig
