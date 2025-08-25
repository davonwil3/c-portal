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
  // Custom domain configuration
  async rewrites() {
    return [
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
