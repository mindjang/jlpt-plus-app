'use client'

import { Suspense } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { BottomNav } from '../_components/BottomNav'
import { ErrorBoundary } from '@/components/ErrorBoundary'

function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  // 하단 네비게이션을 숨겨야 하는 경로들
  const hideBottomNav = 
    pathname === '/login' ||
    pathname === '/stats' ||
    pathname === '/game' ||
    pathname?.startsWith('/acquire/auto-study/') ||
    pathname?.startsWith('/practice/learn') ||
    pathname?.startsWith('/acquire/word') ||
    pathname?.startsWith('/acquire/kanji') ||
    pathname?.startsWith('/game/') ||
    // 사이드 메뉴에서 진입한 화면은 하단 네비 숨김
    searchParams.get('from') === 'menu' ||
    (pathname === '/quiz' && searchParams.get('state') === 'playing') ||
    (pathname === '/quiz/result') ||
    (pathname === '/practice/result')


  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-page w-full overflow-x-hidden">
        <div className={`mx-auto max-w-lg w-full min-h-screen overflow-x-hidden`}>
          {children}
        </div>
        {!hideBottomNav && <BottomNav />}
      </div>
    </ErrorBoundary>
  )
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-page w-full overflow-x-hidden">
        <div className="mx-auto max-w-lg w-full min-h-screen overflow-x-hidden">
          {children}
        </div>
      </div>
    }>
      <LayoutContent>{children}</LayoutContent>
    </Suspense>
  )
}

