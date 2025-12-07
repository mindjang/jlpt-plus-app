'use client'

import React from 'react'

interface StreakChipProps {
  count: number
  className?: string
}

export const StreakChip: React.FC<StreakChipProps> = ({ count, className = '' }) => {
  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-chip-bg ${className}`}>
      <span className="text-label">🔥</span>
      <span className="text-label font-medium text-text-sub">{count}</span>
    </div>
  )
}

