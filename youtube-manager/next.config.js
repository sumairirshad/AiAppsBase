const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep this app isolated from the parent repo's lockfile/config so Next.js
  // doesn't pick up the parent's tailwind/postcss setup.
  turbopack: {
    root: path.join(__dirname),
  },
};

module.exports = nextConfig;
