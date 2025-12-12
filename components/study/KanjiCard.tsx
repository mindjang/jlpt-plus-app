'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPencil, faEye, faEyeSlash, faFileLines, faRotateLeft } from '@fortawesome/free-solid-svg-icons'
import type { Kanji, JlptLevel } from '@/lib/types/content'
import type { Grade, UserCardState } from '@/lib/types/srs'
import { LevelChip } from '../ui/LevelChip'
import { useRelatedWords } from '@/hooks/useRelatedWords'
import { Level } from '@/data'

interface KanjiCardProps {
  kanji: Kanji
  level: string
  isNew?: boolean
  cardState?: UserCardState | null
  onGrade: (grade: Grade) => void
  onNext: () => void
  onGradeStateChange?: (selectedGrade: Grade | null, nextReviewInterval: number | null) => void
}

/**
 * 한자 학습 카드 컴포넌트
 */
export function KanjiCard({
  kanji,
  level,
  isNew = false,
  cardState = null,
  onGrade,
  onNext,
  onGradeStateChange,
}: KanjiCardProps) {
  const router = useRouter()
  const [showMeaning, setShowMeaning] = useState(false)
  const [showFurigana, setShowFurigana] = useState(false)
  const [showReadings, setShowReadings] = useState(false)

  const {
    availableLevels,
    activeLevel,
    setActiveLevel,
    examplePage,
    setExamplePage,
    totalPages,
    currentPageWords,
  } = useRelatedWords({
    kanjiCharacter: kanji.character,
    kanjiLevel: kanji.level,
  })

  // 카드가 변경될 때 상태 초기화
  useEffect(() => {
    setShowMeaning(false)
    setShowFurigana(false)
    setShowReadings(false)
    setExamplePage(0)
  }, [kanji.character, setExamplePage])

  // 모든 내용이 보이는지 확인 (눈 아이콘 상태용)
  const isAllVisible = showMeaning && showFurigana && showReadings

  // 눈 아이콘 클릭: 모든 것을 한 번에 보이기/숨기기
  const handleToggleAll = () => {
    if (isAllVisible) {
      setShowMeaning(false)
      setShowFurigana(false)
      setShowReadings(false)
    } else {
      setShowMeaning(true)
      setShowFurigana(true)
      setShowReadings(true)
    }
  }

  const handleReset = () => {
    setShowMeaning(false)
    setShowFurigana(false)
    setShowReadings(false)
  }

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
          <div className="absolute top-4 left-4">
            <span className="text-label font-medium text-white bg-blue-500 px-3 py-1 rounded-full">
              New
            </span>
          </div>
        )}

        {/* 우측 상단 아이콘 */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          {/* 펜 아이콘 (위치만) */}
          <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-page transition-colors">
            <FontAwesomeIcon icon={faPencil} className="text-text-sub text-sm" />
          </button>
          {/* 눈 아이콘 (모든 내용 보이기/숨기기 토글) */}
          <button
            onClick={handleToggleAll}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-page transition-colors"
          >
            <FontAwesomeIcon 
              icon={isAllVisible ? faEye : faEyeSlash} 
              className="text-text-sub text-sm" 
            />
          </button>
          {/* 상세 아이콘 */}
          <button
            onClick={() => router.push(`/acquire/kanji/${encodeURIComponent(kanji.character)}`)}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-page transition-colors"
          >
            <FontAwesomeIcon icon={faFileLines} className="text-text-sub text-sm" />
          </button>
        </div>

        {/* 카드 내용 */}
        <div className="mb-6 pt-8">
          {/* 한자 표시 */}
          <div className="mb-6 text-center">
            <h1 className="text-display-l text-jp font-medium text-text-main mb-4">
              {kanji.character}
            </h1>
            
            {/* 의미 표시 (visibility로 높이 유지) */}
            <div className={`mb-4 ${showMeaning ? 'visible' : 'invisible'}`}>
              <p className="text-title text-text-main font-semibold">
              </p>
            </div>

            {/* 음독/훈독 표시 */}
            <div className="mb-4 space-y-2 text-left">
              {kanji.onyomi && kanji.onyomi.length > 0 && (
                <div className="flex items-center">
                  <span className="text-label text-text-sub mr-2">음독</span>
                  {showReadings ? (
                    <span className="text-label text-jp font-medium text-text-main">
                      {kanji.onyomi.join('・')}
                    </span>
                  ) : (
                    <span className="text-label text-text-sub">•••</span>
                  )}
                </div>
              )}
              {kanji.kunyomi && kanji.kunyomi.length > 0 && (
                <div className="flex items-center">
                  <span className="text-label text-text-sub mr-2">훈독</span>
                  {showReadings ? (
                    <span className="text-label text-jp font-medium text-text-main">
                      {kanji.kunyomi.join('・')}
                    </span>
                  ) : (
                    <span className="text-label text-text-sub">•••</span>
                  )}
                </div>
              )}
            </div>

            {/* 레벨 탭 (N5~N1) - 단어가 있는 레벨만 표시 */}
            {availableLevels.size > 0 && (
              <div className="mb-4 flex justify-center gap-2">
                {(['N5', 'N4', 'N3', 'N2', 'N1'] as Level[]).map((lv) => {
                  if (!availableLevels.has(lv)) return null
                  return (
                    <button
                      key={lv}
                      onClick={() => {
                        setActiveLevel(lv)
                        setExamplePage(0)
                      }}
                      className={`px-3 py-1 rounded-full text-label font-medium transition-colors ${
                        activeLevel === lv
                          ? 'bg-primary text-white'
                          : 'bg-page text-text-sub'
                      }`}
                    >
                      {lv}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* 예문 단어 리스트 (3개씩 페이지네이션) */}
          {currentPageWords.length > 0 && (
            <div className="mb-4">
              {/* 페이지네이션 네비게이션 */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mb-3">
                  <button
                    onClick={() => setExamplePage(Math.max(0, examplePage - 1))}
                    disabled={examplePage === 0}
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-page transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <span className="text-body text-text-sub">‹</span>
                  </button>
                  <span className="text-body text-text-sub">
                    {examplePage + 1}/{totalPages}
                  </span>
                  <button
                    onClick={() => setExamplePage(Math.min(totalPages - 1, examplePage + 1))}
                    disabled={examplePage >= totalPages - 1}
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-page transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <span className="text-body text-text-sub">›</span>
                  </button>
                </div>
              )}

              {/* 예문 단어 리스트 */}
              <div className="space-y-2">
                {currentPageWords.map((word, index) => (
                  <div
                    key={word.id || index}
                    className="flex items-center gap-2 px-3 py-2 rounded-card bg-page"
                  >
                    <LevelChip level={word.level as JlptLevel} />
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-subtitle text-jp font-medium text-text-main">
                        {word.kanji || word.kana}
                      </span>
                      {showFurigana && word.kanji && (
                        <span className="text-label text-jp text-text-sub">
                          {word.kana}
                        </span>
                      )}
                    </div>
                    {showMeaning && (
                      <span className="text-body text-text-sub">
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 하단 버튼 영역 */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
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
            onClick={() => {
              const newShowFurigana = !showFurigana
              setShowFurigana(newShowFurigana)
              // 히라가나를 보이면 음독/훈독도 함께 보이기, 숨기면 함께 숨기기
              setShowReadings(newShowFurigana)
            }}
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
