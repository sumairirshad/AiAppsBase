/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['images.unsplash.com', 'via.placeholder.com'],
  },
  experimental: {
    serverComponentsExternalPackages: ['ssh2-sftp-client', 'ssh2'],
  },
}

module.exports = nextConfig
