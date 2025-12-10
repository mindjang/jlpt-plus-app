'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LevelChip } from './LevelChip'

type Level = 'N1' | 'N2' | 'N3' | 'N4' | 'N5'

interface FlashCardProps {
  level: Level
  kanji: string
  furigana?: string
  meaning: string
  example?: string
  exampleMeaning?: string
  onNext: () => void
  onKnow: () => void
  onReview: () => void
  showNew?: boolean
}

export const FlashCard: React.FC<FlashCardProps> = ({
  level,
  kanji,
  furigana,
  meaning,
  example,
  exampleMeaning,
  onNext,
  onKnow,
  onReview,
  showNew = false,
}) => {
  const [showFurigana, setShowFurigana] = useState(false)
  const [showMeaning, setShowMeaning] = useState(false)
  const [actionLocked, setActionLocked] = useState(false)

  // 카드가 바뀌면 액션 잠금 해제
  React.useEffect(() => {
    setActionLocked(false)
    setShowMeaning(false)
    setShowFurigana(false)
  }, [kanji])

  return (
    <div className="w-full max-w-md mx-auto">
      {/* 진행도 바 */}
      <div className="mb-6">
        <div className="h-1 bg-divider rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: '0%' }}
            animate={{ width: '60%' }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* 카드 */}
      <motion.div
        className="bg-surface rounded-card shadow-soft p-8 relative"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.18 }}
      >
        {/* NEW 라벨 */}
        {showNew && (
          <div className="absolute top-4 right-4">
            <span className="text-label font-medium text-primary bg-level-n5 px-2 py-1 rounded-chip">
              NEW
            </span>
          </div>
        )}

        {/* 우측 상단 3버튼 */}
        <div className="absolute top-4 right-4 flex gap-2">
          <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-divider transition-colors">
            <span className="text-body">⋯</span>
          </button>
        </div>

        {/* 카드 내용 */}
        <div className="text-center mb-8">
          {/* 레벨 칩 */}
          <div className="mb-4">
            <LevelChip level={level} />
          </div>

          {/* 한자 */}
          <div className="mb-6">
            <h1 className="text-display-l text-jp font-medium text-text-main mb-2">
              {kanji}
            </h1>
            {furigana && (
              <button
                onClick={() => setShowFurigana(!showFurigana)}
                className="text-subtitle text-text-sub hover:text-text-main transition-colors"
              >
                {showFurigana ? furigana : '히라가나 보기'}
              </button>
            )}
          </div>

          {/* 의미 */}
          <AnimatePresence>
            {showMeaning && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4"
              >
                <p className="text-title text-text-main font-semibold mb-2">
                  {meaning}
                </p>
                {example && (
                  <div className="text-body text-text-sub">
                    <p className="text-jp mb-1">{example}</p>
                    {exampleMeaning && (
                      <p className="text-kr">{exampleMeaning}</p>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 하단 버튼 영역 */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => setShowMeaning(!showMeaning)}
            className="button-press w-full py-3 px-4 rounded-card bg-primary text-surface text-body font-medium"
          >
            {showMeaning ? '의미 숨기기' : '의미 보기'}
          </button>

          <div className="flex gap-2">
            <button
              onClick={() => {
                setShowFurigana(!showFurigana)
              }}
              className="button-press flex-1 py-3 px-4 rounded-card bg-surface border border-divider text-text-main text-body font-medium"
            >
              히라가나
            </button>
            <button
              onClick={() => {
                if (actionLocked) return
                setActionLocked(true)
                onReview()
              }}
              className="button-press flex-1 py-3 px-4 rounded-card bg-surface border border-divider text-text-main text-body font-medium"
              disabled={actionLocked}
            >
              다시학습
            </button>
            <button
              onClick={() => {
                if (actionLocked) return
                setActionLocked(true)
                onKnow()
              }}
              className="button-press flex-1 py-3 px-4 rounded-card bg-surface border border-divider text-text-main text-body font-medium"
              disabled={actionLocked}
            >
              알고있음
            </button>
          </div>

          <button
            onClick={onNext}
            className="button-press w-full py-3 px-4 rounded-card bg-disabled-bg text-disabled-text text-body font-medium"
            disabled
          >
            다음
          </button>
        </div>
      </motion.div>
    </div>
  )
}


