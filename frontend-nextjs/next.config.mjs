import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

/** @type {import('next').NextConfig} */
const runtimeImageHosts = [
  process.env.SUPABASE_PUBLIC_URL,
  process.env.NEXT_PUBLIC_SITE_URL,
]
  .filter(Boolean)
  .map((value) => {
    try {
      return new URL(value).hostname;
    } catch {
      return null;
    }
  })
  .filter(Boolean);

const nextConfig = {
  reactStrictMode: true,
  
  // Image optimization
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.example.com' },
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: '*.supabase.in' },
      ...runtimeImageHosts.map((hostname) => ({
        protocol: 'https',
        hostname,
        pathname: '/storage/v1/object/public/**',
      })),
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },

  // Performance optimizations
  compress: true,
  
  // Reduce JavaScript bundle size
  experimental: {
    optimizePackageImports: ['next-intl', '@supabase/supabase-js'],
  },

  // Modern browser targets to reduce legacy JavaScript
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // Webpack optimizations
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Tree shaking for client-side bundles
      config.optimization = {
        ...config.optimization,
        usedExports: true,
        sideEffects: false,
      };
    }
    return config;
  },

  // Security headers
  async headers() {
    const connectSrc = ["'self'", 'https://*.supabase.co'];

    const apiBase = process.env.NEXT_PUBLIC_API_BASE;
    if (apiBase) {
      try {
        const apiOrigin = new URL(apiBase).origin;
        if (!connectSrc.includes(apiOrigin)) {
          connectSrc.push(apiOrigin);
        }
      } catch {
        // ignore invalid URL
      }
    } else {
      // Fallback for local dev backend
      connectSrc.push('http://localhost:8080');
    }

    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://*.supabase.co",
      "font-src 'self'",
      "worker-src 'self' blob:",
      `connect-src ${connectSrc.join(' ')}`,
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ');

    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-XSS-Protection', value: '0' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          {
            key: 'Content-Security-Policy',
            value: csp,
          },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
