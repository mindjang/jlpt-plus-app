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
  // 결제 팝업을 위한 COOP 헤더 설정
  async headers() {
    return [
      {
        // 모든 경로에 적용
        source: '/:path*',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
        ],
      },
    ]
  },
  webpack: (config, { isServer }) => {
    // 클라이언트 번들에서 firebase-admin 제외
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        tls: false,
        fs: false,
        child_process: false,
      }
      // firebase-admin을 클라이언트 번들에서 제외
      config.externals = config.externals || []
      config.externals.push({
        'firebase-admin': 'commonjs firebase-admin',
      })
    }
    return config
  },
}

module.exports = withPWA(nextConfig)


