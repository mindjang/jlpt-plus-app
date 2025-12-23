'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { TabIcon } from './TabIcon'
import { LEVEL_COLORS, MOGU_BRAND_COLORS } from '@/lib/constants/colors'

export interface TabItem {
  id: string
  label: string
  href: string
  icon: string
}

const tabs: TabItem[] = [
  {
    id: 'home',
    label: '홈',
    href: '/home',
    icon: 'home',
  },
  {
    id: 'acquire',
    label: '기억',
    href: '/acquire',
    icon: 'acquire',
  },
  {
    id: 'game',
    label: '게임',
    href: '/intro/game',
    icon: 'game',
  },
  {
    id: 'quiz',
    label: '퀴즈',
    href: '/quiz',
    icon: 'practice',
  },
  {
    id: 'my',
    label: '마이',
    href: '/my',
    icon: 'my',
  },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-area-bottom rounded-t-3xl">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-around h-14 px-2">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/')
            return (
              <Link
                key={tab.id}
                href={tab.href}
                aria-current={isActive ? 'page' : undefined}
                className="flex flex-col items-center justify-center flex-1 h-full transition-all duration-200 relative group"
              >
                <TabIcon name={tab.icon} active={isActive} />
                {!(tab.id === 'game' && isActive) && (
                  <span
                    className="text-[0.675rem] transition-all duration-200"
                    style={{
                      color: isActive ? MOGU_BRAND_COLORS.primary : '#9CA3AF',
                      fontWeight: 500,
                    }}
                  >
                    {tab.label}
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}

