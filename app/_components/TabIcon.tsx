'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { MOGU_BRAND_COLORS } from '@/lib/constants/colors'

interface TabIconProps {
  name: string
  active: boolean
}

export function TabIcon({ name, active }: TabIconProps) {
  const baseClasses = 'w-6 h-6 transition-all duration-300'
  const strokeColor = active ? MOGU_BRAND_COLORS.primary : '#9CA3AF'
  const fillColor = active ? `${MOGU_BRAND_COLORS.primary}20` : 'none' // 20% opacity fill for active
  const strokeWidth = 1.5

  const renderIcon = () => {
    const accentColor = active ? '#FF8C00' : 'transparent'
    switch (name) {
      case 'home':
        return (
          <svg
            className={baseClasses}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            viewBox="0 0 24 24"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <path d="M9 22V12h6v10" fill={accentColor} fillOpacity={0.4} />
          </svg>
        )
      case 'acquire':
        return (
          <svg
            className={baseClasses}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            viewBox="0 0 24 24"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292" />
            <path d="M12 6.042a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" stroke={accentColor} strokeWidth={active ? 2.5 : 1.5} />
          </svg>
        )
      case 'practice':
        return (
          <svg
            className={baseClasses}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            viewBox="0 0 24 24"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <path d="M14 2v6h6" fill={accentColor} fillOpacity={0.4} />
            <path d="M8 13h8M8 17h5" stroke={accentColor} opacity={active ? 1 : 0} />
          </svg>
        )
      case 'my':
        return (
          <svg
            className={baseClasses}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            viewBox="0 0 24 24"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="7" r="4" fill={accentColor} fillOpacity={0.3} />
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          </svg>
        )
      case 'game':
        return (
          <svg
            className={baseClasses}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            viewBox="0 0 24 24"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="2" y="6" width="20" height="12" rx="2" fill={accentColor} fillOpacity={0.3} />
            <path d="M6 12h4m-2-2v4m7-1h.01m2.99-2h.01" />
          </svg>
        )
      default:
        return null
    }
  }

  return (
    <div className="flex items-center justify-center relative">
      {active && (
        <motion.div
          layoutId="active-tab-glow"
          className="absolute inset-0 bg-primary/10 blur-xl rounded-full scale-150"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
      )}
      {renderIcon()}
    </div>
  )
}

