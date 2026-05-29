import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  serverExternalPackages: ['@react-pdf/renderer'],
  allowedDevOrigins: [
    '.space-z.ai',
    '127.0.0.1',
    'localhost',
  ],
};

export default nextConfig;
