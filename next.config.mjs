/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
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
