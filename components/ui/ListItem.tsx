'use client'

import React from 'react'
import { LevelChip } from './LevelChip'

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
      className="flex items-center px-4 py-2.5 bg-surface rounded-lg shadow-soft cursor-pointer transition-all duration-200 active:scale-[0.98]"
      onClick={onClick}
    >
      {/* 레벨 칩 */}
      <div className="flex-shrink-0 mr-2">
        <LevelChip level={level} />
      </div>

      {/* 단어 + 정보 (한 시선에 들어오도록 배치) */}
      <div className="flex items-center justify-between gap-4 flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-label text-jp font-bold text-text-main flex-shrink-0 leading-none">
            {word}
          </span>
          {furigana && (
            <span className="text-label text-jp text-text-hint font-medium leading-tight mb-0.5">
              {furigana}
            </span>
          )}
        </div>

        <div className="flex flex-col justify-center min-w-0">
          <span className="text-label font-bold text-text-sub truncate leading-tight">
            {meaning}
          </span>
        </div>
      </div>

      {/* 우측 아이콘 (화살표 대신 단순화) */}
      <div className="flex-shrink-0 ml-2">
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className="text-text-hint">
          <path d="M7 5l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  )
}


