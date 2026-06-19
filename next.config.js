/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
  // rewrites 제거: /api/ 요청은 Route Handler(adminProxy)가 처리하도록 함
  // adminProxy가 세션 체크 + x-admin-secret 헤더를 추가하여 백엔드로 전달
};

export default nextConfig;