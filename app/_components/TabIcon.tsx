'use client'

import React from 'react'
import { MOGU_BRAND_COLORS } from '@/lib/constants/colors'

interface TabIconProps {
  name: string
  active: boolean
}

export function TabIcon({ name, active }: TabIconProps) {
  const baseClasses = 'w-6 h-6 transition-all duration-300'
  // Mogu 브랜드 포인트 컬러 사용 (또는 LEVEL_COLORS.N5 사용 가능)
  const strokeColor = active ? MOGU_BRAND_COLORS.primary : '#9CA3AF'
  const strokeWidth = 1.5

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
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
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
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="9" y1="15" x2="15" y2="15" />
            <line x1="12" y1="12" x2="12" y2="18" />
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
    </div>
  )
}

