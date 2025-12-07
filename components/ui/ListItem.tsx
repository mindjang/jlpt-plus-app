'use client'

import React from 'react'
import { LevelChip } from './LevelChip'
import { motion } from 'framer-motion'

type Level = 'N1' | 'N2' | 'N3' | 'N4' | 'N5'

interface ListItemProps {
  level: Level
  word: string
  furigana?: string
  meaning: string
  onClick?: () => void
}

export const ListItem: React.FC<ListItemProps> = ({
  level,
  word,
  furigana,
  meaning,
  onClick,
}) => {
  return (
    <div
      className="flex items-center px-4 py-2.5 border-b border-divider cursor-pointer hover:bg-page transition-colors"
    >
      {/* 레벨 칩 */}
      <LevelChip level={level} />

      {/* 단어 + 후리가나 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          {/* 불릿 포인트 */}
          <span className="text-body text-text-sub">•</span>
          <span className="text-subtitle text-jp font-medium text-text-main truncate">
            {word}
          </span>
          {furigana && (
            <span className="text-label text-jp text-text-sub flex-shrink-0">
              {furigana}
            </span>
          )}
        </div>
      </div>

      {/* 뜻 */}
      <div className="flex-1 text-right mr-4">
        <span className="text-body text-text-sub truncate block">
          {meaning}
        </span>
      </div>

      {/* 화살표 */}
      <div className="flex-shrink-0">
        <span className="text-body text-text-hint">›</span>
      </div>
    </div>
  )
}


