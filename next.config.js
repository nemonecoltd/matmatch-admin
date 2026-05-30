/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
  async rewrites() {
    return [
      {
        source: '/api/auth/:path*', // NextAuth.js API 라우트는 rewrites에서 제외
        destination: '/api/auth/:path*',
      },
      {
        source: '/api/:path*', // 그 외의 /api 요청은 백엔드로 전달
        destination: 'http://34.64.98.113:8080/:path*',
        // destination: 'http://127.0.0.1:8080/:path*',
      },
    ];
  },
};

export default nextConfig;