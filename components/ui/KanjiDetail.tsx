'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { LevelChip } from './LevelChip'

type Level = 'N1' | 'N2' | 'N3' | 'N4' | 'N5'

interface KanjiDetailProps {
  level: Level
  kanji: string
  onYomi?: string[]
  kunYomi?: string[]
  radical?: string | null
  strokeCount?: number
  relatedWords?: Array<{
    word: string
    furigana?: string
    meaning: string
  }>
  onStrokeOrderClick?: () => void
}

export const KanjiDetail: React.FC<KanjiDetailProps> = ({
  level,
  kanji,
  onYomi,
  kunYomi,
  radical,
  strokeCount,
  relatedWords = [],
  onStrokeOrderClick,
}) => {
  const [showStrokeOrder, setShowStrokeOrder] = useState(false)

  return (
    <div className="w-full">
      {/* 한자 대형 글자 */}
      <div className="text-center mb-6">
        <h1 className="text-display-l text-jp font-medium text-text-main mb-4">
          {kanji}
        </h1>
        <LevelChip level={level} />
      </div>

      {/* 음독/훈독 칩 */}
      <div className="flex flex-wrap gap-2 mb-4">
        {onYomi?.map((yomi, index) => (
          <span
            key={`on-${index}`}
            className="px-3 py-1.5 rounded-chip bg-chip-bg text-chip-text text-label font-medium"
          >
            {yomi}
          </span>
        ))}
        {kunYomi?.map((yomi, index) => (
          <span
            key={`kun-${index}`}
            className="px-3 py-1.5 rounded-chip bg-chip-bg text-chip-text text-label font-medium"
          >
            {yomi}
          </span>
        ))}
      </div>

      {/* 부수 칩 */}
      {radical && (
        <div className="mb-4">
          <span className="px-3 py-1.5 rounded-chip bg-chip-radical text-chip-text text-label font-medium">
            부수: {radical}
          </span>
        </div>
      )}

      {/* 획순 버튼 - 상단 */}
      {strokeCount && onStrokeOrderClick && (
        <div className="mb-6 flex justify-end">
          <button
            onClick={onStrokeOrderClick}
            className="button-press px-4 py-2 rounded-card bg-surface border border-divider text-body text-text-main font-medium hover:bg-page transition-colors flex items-center gap-2"
          >
            <span>{kanji} 획순</span>
            <span>›</span>
          </button>
        </div>
      )}

      {/* 활용 단어 리스트 */}
      {relatedWords.length > 0 && (
        <div className="mb-6">
          <h3 className="text-subtitle font-medium text-text-main mb-3">
            활용 단어
          </h3>
          <div className="space-y-2">
            {relatedWords.map((word, index) => (
              <motion.div
                key={index}
                className="bg-surface rounded-card p-4 border border-divider"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-subtitle text-jp font-medium text-text-main">
                    {word.word}
                  </span>
                  {word.furigana && (
                    <span className="text-label text-jp text-text-sub">
                      {word.furigana}
                    </span>
                  )}
                </div>
                <p className="text-body text-text-sub">{word.meaning}</p>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* 외부 링크 영역 */}
      <div className="flex gap-3">
        <a
          href={`https://dict.naver.com/search.nhn?query=${encodeURIComponent(kanji)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="button-press flex-1 px-4 py-3 rounded-card bg-surface border border-divider text-body text-text-main font-medium text-center hover:bg-page transition-colors"
        >
          네이버 사전
        </a>
        <a
          href={`https://chat.openai.com/?q=${encodeURIComponent(kanji)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="button-press flex-1 px-4 py-3 rounded-card bg-surface border border-divider text-body text-text-main font-medium text-center hover:bg-page transition-colors"
        >
          ChatGPT
        </a>
      </div>
    </div>
  )
}


