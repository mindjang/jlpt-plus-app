'use client'

import { usePathname } from 'next/navigation'
import { BottomNav } from '../_components/BottomNav'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  
  // 하단 네비게이션을 숨겨야 하는 경로들
  const hideBottomNav = 
    pathname?.startsWith('/acquire/auto-study/') ||
    pathname?.startsWith('/practice/learn') ||
    pathname?.startsWith('/acquire/word') ||
    pathname?.startsWith('/acquire/kanji')

  return (
    <div className="min-h-screen bg-page w-full overflow-x-hidden">
      <div className={`mx-auto max-w-lg w-full min-h-screen overflow-x-hidden ${hideBottomNav ? '' : 'pb-16'}`}>
        {children}
      </div>
      {!hideBottomNav && <BottomNav />}
    </div>
  )
}

