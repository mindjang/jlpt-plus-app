'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faRotateLeft } from '@fortawesome/free-solid-svg-icons'
import type { Word } from '@/lib/types/content'
import type { Grade, UserCardState } from '@/lib/types/srs'
import { findNaverWord } from '@/data/words/index'

interface WordCardProps {
  word: Word
  isNew?: boolean
  cardState?: UserCardState | null
  onGrade: (grade: Grade) => void
  onNext: () => void
  onGradeStateChange?: (selectedGrade: Grade | null, nextReviewInterval: number | null) => void
}

/**
 * 단어 학습 카드 컴포넌트
 */
export function WordCard({
  word,
  isNew = false,
  cardState = null,
  onGrade,
  onNext,
  onGradeStateChange,
}: WordCardProps) {
  const [showMeaning, setShowMeaning] = useState(false)
  const [showFurigana, setShowFurigana] = useState(false)

  // 네이버 단어 데이터 찾기 (kanji 또는 kana로 검색)
  const naverWord = useMemo(() => {
    if (word.kanji) {
      return findNaverWord(word.kanji) || findNaverWord(word.kana)
    }
    return findNaverWord(word.kana)
  }, [word.kanji, word.kana])

  // 카드가 변경될 때 상태 초기화
  useEffect(() => {
    setShowMeaning(false)
    setShowFurigana(false)
  }, [word.id])

  return (
    <div className="w-full max-w-md mx-auto">
      {/* 카드 */}
      <motion.div
        className="bg-surface rounded-card shadow-soft p-6 relative"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.18 }}
      >
        {/* NEW 라벨 */}
        {isNew && (
          <div className="absolute top-4 right-4">
            <span className="text-label font-medium text-white bg-blue-500 px-3 py-1 rounded-full">
              New
            </span>
          </div>
        )}

        {/* 카드 내용 */}
        <div className="mb-6">
          {/* 단어 표시 */}
          <div className="mb-4">
            <h1 className="text-display-l text-jp font-medium text-text-main mb-2 text-center">
              {word.kanji || word.kana}
            </h1>
            {word.kanji && showFurigana && (
              <div className="text-subtitle text-text-sub text-center">
                {word.kana}
              </div>
            )}
          </div>

          {/* 예문 표시 */}
          {word.examples && word.examples.length > 0 && (
            <div className="mb-4 text-center">
              <div className="text-jp text-body text-text-main">
                {word.examples[0].ja}
              </div>
            </div>
          )}

          {/* 의미 표시 */}
          <AnimatePresence>
            {showMeaning && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4"
              >
                {naverWord && naverWord.partsMeans && naverWord.partsMeans.length > 0 ? (
                  // 네이버 데이터가 있으면 partsMeans 표시
                  <div className="space-y-3">
                    {naverWord.partsMeans.map((partMean, index) => (
                      <div key={index} className="text-center">
                        {/* Part 뱃지 */}
                        {partMean.part && (
                          <div className="mb-2">
                            <span className="inline-block px-2 py-1 text-label font-medium text-text-sub bg-page rounded-md">
                              {partMean.part}
                            </span>
                          </div>
                        )}
                        
                        {/* Means 표시 */}
                        {partMean.means && partMean.means.length > 0 && (
                          <div className="space-y-1">
                            {partMean.means.map((mean, meanIndex) => (
                              <div key={meanIndex} className="text-body text-text-main">
                                {mean}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  // 네이버 데이터가 없으면 기존 방식으로 표시
                  <div className="text-center">
                
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 하단 버튼 영역 */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setShowMeaning(false)
              setShowFurigana(false)
            }}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-surface border border-divider hover:bg-page transition-colors"
          >
            <FontAwesomeIcon icon={faRotateLeft} className="text-text-sub text-sm" />
          </button>
          <button
            onClick={() => setShowMeaning(!showMeaning)}
            className={`button-press flex-1 py-3 px-4 rounded-card text-body font-medium ${
              showMeaning
                ? 'bg-primary text-white'
                : 'bg-surface border border-divider text-text-main'
            }`}
          >
            의미
          </button>
          <button
            onClick={() => setShowFurigana(!showFurigana)}
            className={`button-press flex-1 py-3 px-4 rounded-card text-body font-medium ${
              showFurigana
                ? 'bg-primary text-white'
                : 'bg-surface border border-divider text-text-main'
            }`}
          >
            히라가나
          </button>
        </div>
      </motion.div>
    </div>
  )
}
