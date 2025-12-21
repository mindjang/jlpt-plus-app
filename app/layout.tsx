import type { Metadata, Viewport } from 'next'
import { Noto_Sans_JP, Inter, Orbitron, Press_Start_2P } from 'next/font/google'
import Script from 'next/script'
import { config } from '@fortawesome/fontawesome-svg-core'
import '@fortawesome/fontawesome-svg-core/styles.css'
import './globals.css'
import { Providers } from '@/components/Providers'
import { LEVEL_COLORS } from '@/lib/constants/colors'

// FontAwesome CSS 자동 주입 비활성화 (SVG만 사용)
config.autoAddCss = false

const notoSansJP = Noto_Sans_JP({
  subsets: ['latin'],
  variable: '--font-noto-sans-jp',
  weight: ['400', '500', '600'],
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  weight: ['400', '500', '600'],
})

const orbitron = Orbitron({
  subsets: ['latin'],
  variable: '--font-orbitron',
  weight: ['400', '500', '600', '700', '800', '900'],
})

const pressStart2P = Press_Start_2P({
  subsets: ['latin'],
  variable: '--font-press-start-2p',
  weight: ['400'],
})

export const metadata: Metadata = {
  metadataBase: new URL('https://jlpt.mogu.ai.kr'),
  title: 'Mogu-JLPT',
  description: 'MoguMogu 언어 학습 플랫폼 - JLPT 시험 대비 간격 반복 학습',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Mogu-JLPT',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: LEVEL_COLORS.N1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko" className={`${notoSansJP.variable} ${inter.variable} ${orbitron.variable} ${pressStart2P.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
