const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://js.stripe.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self' data:",
  "media-src 'self' blob:",
  "connect-src 'self' https://api.stripe.com",
  "frame-src https://js.stripe.com https://checkout.stripe.com",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ')

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(self), geolocation=()' },
  { key: 'Content-Security-Policy-Report-Only', value: contentSecurityPolicy },
]

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  poweredByHeader: false,
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'ginicci.app' }],
        destination: 'https://www.ginicci.app/:path*',
        permanent: true,
      },
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'ginicci.com' }],
        destination: 'https://www.ginicci.app/:path*',
        permanent: true,
      },
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.ginicci.com' }],
        destination: 'https://www.ginicci.app/:path*',
        permanent: true,
      },
    ]
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }, { source: '/pwa-sw.js', headers: [{ key: 'Cache-Control', value: 'no-store' }] }, { source: '/assistant', headers: [{ key: 'Cache-Control', value: 'private, no-store' }] }]
  },
}

export default nextConfig
