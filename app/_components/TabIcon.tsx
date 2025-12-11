'use client'

import React from 'react'

interface TabIconProps {
  name: string
  active: boolean
}

export function TabIcon({ name, active }: TabIconProps) {
  const baseClasses = 'w-6 h-6 transition-colors'
  const activeClasses = active ? 'text-[#FF8A00]' : 'text-text-sub'

  // 간단한 SVG 아이콘 (나중에 더 나은 아이콘으로 교체 가능)
  const renderIcon = () => {
    switch (name) {
      case 'home':
        return (
          <svg
            className={`${baseClasses} ${activeClasses}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
        )
      case 'stats':
        return (
          <svg
            className={`${baseClasses} ${activeClasses}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        )
      case 'acquire':
        return (
          <img
            src={active 
              ? 'https://img.icons8.com/plasticine/100/literature.png'
              : 'https://img.icons8.com/carbon-copy/100/literature.png'
            }
            alt="literature"
            className="w-7 h-7"
          />
        )
      case 'practice':
        return (
          <img
            src={active 
              ? 'https://img.icons8.com/plasticine/100/quizlet--v1.png'
              : 'https://img.icons8.com/carbon-copy/100/quizlet--v1.png'
            }
            alt="quizlet"
            className="w-7 h-7"
          />
        )
      case 'my':
        return (
          <img
            src={active 
              ? 'https://img.icons8.com/plasticine/100/info-squared.png'
              : 'https://img.icons8.com/carbon-copy/100/info-squared.png'
            }
            alt="my"
            className="w-7 h-7"
          />
        )
      case 'game':
        return (
          <img
            src={active 
              ? 'https://img.icons8.com/plasticine/100/1010.png'
              : 'https://img.icons8.com/carbon-copy/100/1010.png'
            }
            alt="game"
            className="w-7 h-7"
          />
        )
      default:
        return null
    }
  }

  return <div className="flex items-center justify-center">{renderIcon()}</div>
}

