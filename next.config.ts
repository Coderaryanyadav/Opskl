import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['localhost', 'opskill.vercel.app'],
    formats: ['image/avif', 'image/webp'],
  },
  // Enable static HTML export if needed
  // output: 'export',
  // Disable React's Strict Mode if needed
  // reactStrictMode: false,
  // Configure webpack if needed
  webpack: (config, { isServer }) => {
    // Important: return the modified config
    return config;
  },
  // Environment variables that should be exposed to the browser
  env: {
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'https://opskill.vercel.app',
  },
  // Enable server components external packages
  experimental: {
    serverComponentsExternalPackages: ['better-sqlite3'],
  },
};

export default nextConfig;
