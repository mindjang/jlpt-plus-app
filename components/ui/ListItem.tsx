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
      className="flex items-center px-5 py-4 bg-white/95 backdrop-blur-xl rounded-2xl border border-white/50 shadow-lg shadow-black/5 cursor-pointer transition-all duration-200 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99]"
      onClick={onClick}
    >
      {/* 레벨 칩 */}
      <div className="flex-shrink-0 mr-4">
        <LevelChip level={level} />
      </div>

      {/* 단어 + 후리가나 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-subtitle text-jp font-bold text-text-main truncate">
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
        <span className="text-body text-text-sub">→</span>
      </div>
    </div>
  )
}


