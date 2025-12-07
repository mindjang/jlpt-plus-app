/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development' && !process.env.ENABLE_PWA,
  buildExcludes: [/middleware-manifest\.json$/],
})

const nextConfig = {
  reactStrictMode: true,
  // 개발 환경에서 다른 IP에서 접속 허용
  allowedDevOrigins: process.env.NODE_ENV === 'development' ? ['192.168.0.16'] : undefined,
}

module.exports = withPWA(nextConfig)


