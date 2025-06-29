/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'bcrypt'],
  },
  images: {
    domains: ['localhost', 'res.cloudinary.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  webpack: (config) => {
    // Add support for importing SVGs as React components
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });
    return config;
  },
  // Enable TypeScript paths from tsconfig
  typescript: {
    ignoreBuildErrors: false,
  },
  // Environment variables available to the client
  env: {
    APP_NAME: 'Quantum-Page AI',
    APP_VERSION: '1.0.0',
  },
};

module.exports = nextConfig;
