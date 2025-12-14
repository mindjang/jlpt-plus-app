'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPencil, faEye, faEyeSlash, faFileLines, faRotateLeft } from '@fortawesome/free-solid-svg-icons'
import type { JlptLevel } from '@/lib/types/content'
import type { KanjiAliveEntry } from '@/data/types'
import type { Grade, UserCardState } from '@/lib/types/srs'
import { LevelChip } from '../ui/LevelChip'
import { useRelatedWords } from '@/hooks/useRelatedWords'
import { Level } from '@/data'
import { getKanjiCharacter, getOnYomi, getKunYomi, getKanjiMeaning } from '@/lib/data/kanji/kanjiHelpers'

interface KanjiCardProps {
  className?: string
  kanji: KanjiAliveEntry
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
  className = '',
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

  const kanjiCharacter = getKanjiCharacter(kanji)
  const kanjiLevel = level as JlptLevel

  const {
    availableLevels,
    examplePage,
    setExamplePage,
    totalPages,
    currentPageWords,
  } = useRelatedWords({
    kanjiCharacter,
    kanjiLevel,
  })

  // 카드가 변경될 때 상태 초기화
  useEffect(() => {
    setShowMeaning(false)
    setShowFurigana(false)
    setShowReadings(false)
    setExamplePage(0)
  }, [kanjiCharacter, setExamplePage])

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
    <div className={`w-full max-w-md px-4 mx-auto ${className}`}>
      {/* 카드 */}
      <motion.div 
        className="flex flex-col bg-surface rounded-lg border border-divider relative h-full"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.18 }}
      >
        {/* NEW 라벨 */}
        {isNew && (
          <div className="absolute top-4 left-4">
            <span className="text-label tracking-tighter font-medium text-blue-500 bg-blue-100 px-3 py-1 rounded-full">
              New
            </span>
          </div>
        )}

        {/* 우측 상단 아이콘 */}
        <div className="absolute top-5 right-5 flex items-center gap-1">
          {/* 펜 아이콘 (위치만) */}
          <button className="w-8 h-8 flex items-center justify-center rounded-full active:bg-gray-100 border border-divider">
            <FontAwesomeIcon icon={faPencil} className="text-text-sub" size="2xs" />
          </button>
          {/* 눈 아이콘 (모든 내용 보이기/숨기기 토글) */}
          <button
            onClick={handleToggleAll}
            className="w-8 h-8 flex items-center justify-center rounded-full active:bg-gray-100 border border-divider"
          >
            <FontAwesomeIcon 
              icon={isAllVisible ? faEye : faEyeSlash} 
              className="text-text-sub" size="2xs" 
            />
          </button>
          {/* 상세 아이콘 */}
          <button
            onClick={() => router.push(`/acquire/kanji/${encodeURIComponent(kanjiCharacter)}`)}
            className="h-8 px-2 gap-1 flex items-center justify-center rounded-full active:bg-gray-100 border border-divider"
          >
            <FontAwesomeIcon icon={faFileLines} className="text-text-sub" size="2xs" />
            <span className="text-xs">상세</span>
          </button>
        </div>

        {/* 카드 내용 */}
        <div className="flex-1 p-6">
          {/* 한자 표시 */}
          <div className="text-center">
            <div className="flex flex-col gap-4 pt-20 pb-12">
              <h1 className="text-display-l text-jp font-medium text-text-main">
                {kanjiCharacter}
              </h1>
              
              {/* 의미 표시 (visibility로 높이 유지) */}
              <div className={`${showMeaning ? 'visible' : 'invisible'}`}>
                <p className="text-title text-text-main font-semibold">
                  {getKanjiMeaning(kanji)}
                </p>
              </div>
            </div>

            {/* 음독/훈독 표시 */}
            <div className="space-y-2 text-left">
              {(() => {
                const onyomi = getOnYomi(kanji)
                return onyomi && onyomi.length > 0 && (
                  <div className="flex items-center">
                    <span className="text-label text-text-sub mr-2">음독</span>
                    {showReadings ? (
                      <span className="text-label text-jp font-medium text-text-main">
                        {onyomi.join('・')}
                      </span>
                    ) : (
                      <span className="text-label text-text-sub">•••</span>
                    )}
                  </div>
                )
              })()}
              {(() => {
                const kunyomi = getKunYomi(kanji)
                return kunyomi && kunyomi.length > 0 && (
                  <div className="flex items-center">
                    <span className="text-label text-text-sub mr-2">훈독</span>
                    {showReadings ? (
                      <span className="text-label text-jp font-medium text-text-main">
                        {kunyomi.join('・')}
                      </span>
                    ) : (
                      <span className="text-label text-text-sub">•••</span>
                    )}
                  </div>
                )
              })()}
            </div>
          </div>
        </div>

        {/* 하단 버튼 영역 */}
        <div className="flex items-center gap-2 p-4 border-t border-gray-100">
          <button
            onClick={handleReset}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-surface border border-gray-400 active:bg-gray-100"
          >
            <FontAwesomeIcon icon={faRotateLeft} className="text-text-sub text-sm" />
          </button>
          <button
            onClick={() => setShowMeaning(!showMeaning)}
            className={`button-press flex-1 py-3 px-4 rounded-lg text-body font-medium ${
              showMeaning
                ? 'bg-primary text-white'
                : 'bg-surface border border-gray-400 text-text-main'
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
            className={`button-press flex-1 py-3 px-4 rounded-lg text-body font-medium ${
              showFurigana
                ? 'bg-primary text-white'
                : 'bg-surface border border-gray-400 text-text-main'
            }`}
          >
            히라가나
          </button>
        </div>
        
        {/* 예문 단어 리스트 (N5~N1 순서대로 3개씩) */}
        {currentPageWords.length > 0 && (
          <div className={`px-4 py-3 border-t border-gray-100 bg-gray-50`}>
            <div className="">
              {/* 예문 단어 리스트 */}
              <div className=''>
                {currentPageWords.map((word, index) => {
                  const levelMap: Record<string, JlptLevel> = {
                    '1': 'N1',
                    '2': 'N2',
                    '3': 'N3',
                    '4': 'N4',
                    '5': 'N5',
                  }
                  const wordLevel = levelMap[word.level] || 'N5'
                  const firstMean = word.partsMeans && word.partsMeans.length > 0 && word.partsMeans[0].means && word.partsMeans[0].means.length > 0
                    ? word.partsMeans[0].means[0]
                    : ''
                  
                  return (
                    <div
                      key={word.entry_id || index}
                      className="flex items-center gap-2.5 py-2"
                    >
                      <LevelChip level={wordLevel} />
                      <div className="flex items-center gap-2 flex-1">
                        {word.kanji && <span className="text-body text-jp font-medium text-text-main whitespace-nowrap" dangerouslySetInnerHTML={{ __html: word.kanji.split("·")[0] }}></span>}
                        {showReadings && <span className="text-label text-jp text-text-sub whitespace-nowrap">{word.entry}</span>}
                      </div>
                      {showMeaning && firstMean && (
                        <span className="text-label text-text-sub text-right">
                          {firstMean}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* 페이지네이션 네비게이션 */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => setExamplePage(Math.max(0, examplePage - 1))}
                    disabled={examplePage === 0}
                    className="w-8 h-8 flex items-center justify-center rounded-full active:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <span className="text-body text-text-sub">‹</span>
                  </button>
                  <span className="text-body text-text-sub">
                    {examplePage + 1}/{totalPages}
                  </span>
                  <button
                    onClick={() => setExamplePage(Math.min(totalPages - 1, examplePage + 1))}
                    disabled={examplePage >= totalPages - 1}
                    className="w-8 h-8 flex items-center justify-center rounded-full active:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <span className="text-body text-text-sub">›</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

      </motion.div>
    </div>
  )
}
