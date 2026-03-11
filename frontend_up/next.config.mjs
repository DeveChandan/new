import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5000',
        pathname: '/uploads/**',
      },
    ],
  },
  async rewrites() {
    // If NEXT_PUBLIC_BACKEND_URL is defined, use that, else default to localhost:5000
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
    return [
      {
        // Don't proxy Next.js assets
        source: '/_next/:path*',
        destination: '/_next/:path*',
      },
      {
        // Exact match proxy for Socket.IO to ensure the trailing slash is forwarded
        source: '/api/socket.io/',
        destination: `${backendUrl}/api/socket.io/`, 
      },
      {
        source: '/api/socket.io',
        destination: `${backendUrl}/api/socket.io/`, 
      },
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`, // Proxy to Backend API
      },
      {
        source: '/uploads/:path*',
        destination: `${backendUrl}/uploads/:path*`, // Proxy to Backend static files
      },
    ]
  },
}

export default withNextIntl(nextConfig);
