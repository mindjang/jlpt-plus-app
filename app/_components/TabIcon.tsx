'use client'

import React from 'react'
import { LEVEL_COLORS } from '@/lib/constants/colors'

interface TabIconProps {
  name: string
  active: boolean
}

export function TabIcon({ name, active }: TabIconProps) {
  const baseClasses = 'w-6 h-6 transition-all duration-300'
  const strokeColor = active ? LEVEL_COLORS.N5 : '#9CA3AF'
  const strokeWidth = active ? 2.5 : 1.5

  // 프리미엄 스타일 SVG 아이콘 (Material Design 3 스타일, 세련된 디자인)
  const renderIcon = () => {
    switch (name) {
      case 'home':
        return (
          <svg
            className={baseClasses}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            viewBox="0 0 24 24"
              strokeLinecap="round"
              strokeLinejoin="round"
          >
            <path d="M11.47 3.84a.75.75 0 0 1 1.06 0l8.69 8.69a.75.75 0 1 0 1.06-1.06l-8.69-8.69a2.25 2.25 0 0 0-3.182 0l-8.69 8.69a.75.75 0 0 0 1.061 1.06l8.69-8.69Z" />
            <path d="m12 5.432 8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 0 1-.75-.75v-4.5a.75.75 0 0 0-.75-.75h-3a.75.75 0 0 0-.75.75V21a.75.75 0 0 1-.75.75H5.625a1.875 1.875 0 0 1-1.875-1.875v-6.198a2.29 2.29 0 0 0 .091-.086L12 5.432Z" />
          </svg>
        )
      case 'acquire':
        return (
          <svg
            className={baseClasses}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            viewBox="0 0 24 24"
              strokeLinecap="round"
              strokeLinejoin="round"
          >
            <path d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
          </svg>
        )
      case 'practice':
        return (
          <svg
            className={baseClasses}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            viewBox="0 0 24 24"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* 클립보드 아이콘 */}
            <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
            <rect x="9" y="3" width="6" height="4" rx="1" />
            {/* 체크박스들 */}
            <path d="M9 12h6" />
            <path d="M9 16h6" />
            <path d="M9 8h6" />
          </svg>
        )
      case 'my':
        return (
          <svg
            className={baseClasses}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            viewBox="0 0 24 24"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
          </svg>
        )
      case 'game':
        if (active) {
          // 액티브일 때: 3D 게임기 아이콘 (이모지 + 3D 효과)
          return (
            <div 
              className="relative w-8 h-8 flex items-center justify-center transition-all duration-300"
              style={{
                transform: 'perspective(1000px) rotateY(-15deg) rotateX(5deg)',
                transformStyle: 'preserve-3d',
              }}
            >
              <div
                className="text-4xl leading-none filter drop-shadow-lg"
              >
                🕹️
              </div>
              {/* 네온 글로우 효과 */}
            </div>
          )
        } else {
          // 논액티브일 때: 노멀한 게임 아이콘
        return (
            <svg
              className={baseClasses}
              fill="none"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              viewBox="0 0 24 24"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.25 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z" />
            </svg>
        )
        }
      default:
        return null
    }
  }

  return (
    <div className="flex items-center justify-center relative">
      {renderIcon()}
      {active && (
        <div 
          className="absolute inset-0 rounded-full opacity-20 -z-10 transition-opacity duration-300"
        />
      )}
    </div>
  )
}

