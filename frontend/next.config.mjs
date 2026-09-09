/** @type {import('next').NextConfig} */
const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';

const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${backendUrl.replace(/\/$/, '')}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;

