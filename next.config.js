/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: 'localhost' },
    ],
    formats: ['image/avif', 'image/webp'],
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
