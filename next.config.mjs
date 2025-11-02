/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },
  // Disable static page generation for all routes to prevent prerender errors
  output: 'standalone',
  // Custom domain configuration
  async rewrites() {
    return [
      // Handle portfolio subdomains: subdomain.jolix.io -> /portfolio/[subdomain] (production)
      {
        source: '/',
        destination: '/portfolio/:domain',
        has: [
          {
            type: 'host',
            value: '(?<domain>[^.]+)\.jolix\.io',
          },
        ],
      },
      // Handle portfolio subdomains: subdomain.localhost -> /portfolio/[subdomain] (development)
      {
        source: '/',
        destination: '/portfolio/:domain',
        has: [
          {
            type: 'host',
            value: '(?<domain>[^.]+)\.localhost(:[0-9]+)?',
          },
        ],
      },
      // Handle custom domains for client portals
      {
        source: '/:path*',
        destination: '/:path*',
        has: [
          {
            type: 'host',
            value: '(?<company>[^.]+)\.flowtrack\.works',
          },
        ],
      },
      {
        source: '/:path*',
        destination: '/:path*',
        has: [
          {
            type: 'host',
            value: '(?<company>[^.]+)\.(?<client>[^.]+)\.flowtrack\.works',
          },
        ],
      },
    ]
  },
}

export default nextConfig
