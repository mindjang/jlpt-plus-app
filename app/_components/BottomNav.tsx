'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { TabIcon } from './TabIcon'

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
    id: 'stats',
    label: '통계',
    href: '/stats',
    icon: 'stats',
  },
  {
    id: 'acquire',
    label: '습득존',
    href: '/acquire',
    icon: 'acquire',
  },
  {
    id: 'practice',
    label: '학습존',
    href: '/practice',
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
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-surface border-t border-divider safe-area-bottom">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-around h-16 px-2">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/')
            return (
              <Link
                key={tab.id}
                href={tab.href}
                aria-current={isActive ? 'page' : undefined}
                className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                  isActive ? 'text-primary' : 'text-text-sub'
                }`}
              >
                <TabIcon name={tab.icon} active={isActive} />
                <span
                  className={`text-label mt-1 transition-colors ${
                    isActive ? 'font-semibold text-primary' : 'font-medium text-text-sub'
                  }`}
                >
                  {tab.label}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}

