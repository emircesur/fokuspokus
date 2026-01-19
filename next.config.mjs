/** @type {import('next').NextConfig} */

// For GitHub Pages, set your repo name (e.g., '/fokuspokus')
// For Vercel or root domain, leave as ''
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''

const nextConfig = {
  // Enable static export for Capacitor (Android) and Electron (Windows)
  output: 'export',
  trailingSlash: true,
  basePath: basePath,
  assetPrefix: basePath,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
