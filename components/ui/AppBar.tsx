'use client'

import React, { useState, useEffect } from 'react'
import { SideMenu } from './SideMenu'

interface AppBarProps {
  title: string
  onBack?: () => void
  rightAction?: React.ReactNode
  showMenu?: boolean
  className?: string
}

export const AppBar: React.FC<AppBarProps> = ({
  title,
  onBack,
  rightAction,
  showMenu = false,
  className = '',
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  // 메뉴가 열릴 때 body 스크롤 방지
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isMenuOpen])

  return (
    <>
      <header className={`sticky top-0 z-30 ${className || 'bg-surface border-b border-divider'} w-full`}>
        <div className="flex items-center justify-between h-14 px-4 relative">
          <div className="flex items-center gap-3 flex-1">
            {showMenu && !onBack && (
              <button
                onClick={() => setIsMenuOpen(true)}
                className="button-press w-8 h-8 flex items-center justify-center rounded-full hover:bg-page transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-text-main">
                  <path d="M2 5h16M2 10h16M2 15h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            )}
            {onBack && (
              <button
                onClick={onBack}
                className="button-press w-8 h-8 flex items-center justify-center rounded-full hover:bg-page transition-colors"
              >
                <span className="text-body text-text-main">‹</span>
              </button>
            )}
          </div>
          <h1 className="absolute left-1/2 transform -translate-x-1/2 text-subtitle font-semibold text-text-main">{title}</h1>
          <div className="flex-1 flex justify-end">
            {rightAction && <div>{rightAction}</div>}
          </div>
        </div>
      </header>

      {/* 사이드 메뉴 */}
      <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </>
  )
}


