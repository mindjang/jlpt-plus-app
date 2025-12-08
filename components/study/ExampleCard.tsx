'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPencil, faEye, faEyeSlash, faFileLines, faRotateLeft } from '@fortawesome/free-solid-svg-icons'
import type { Word, Kanji } from '@/lib/types/content'
import type { Grade, UserCardState } from '@/lib/types/srs'
import { reviewCard } from '@/lib/srs/reviewCard'
import { LevelChip } from '../ui/LevelChip'
import { getWordsByLevel } from '@/data/words/index'
import { convertSearchResultToWord } from '@/lib/utils/dataConverter'
import { Level } from '@/data'
import type { SearchResult } from '@/data/types'

// 한자별 관련 단어 캐시 (7일 유지)
const RELATED_WORD_CACHE = new Map<
  string,
  { timestamp: number; items: Word[] }
>()
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000 // 7 days

function getCachedRelatedWords(
  kanjiChar: string,
  level: Level
): Word[] {
  const key = `${kanjiChar}:${level}`
  const now = Date.now()
  const cached = RELATED_WORD_CACHE.get(key)
  if (cached && now - cached.timestamp < CACHE_TTL) {
    return cached.items
  }

  // 해당 레벨의 단어 데이터에서 한자가 포함된 단어 필터링
  const levelWords: SearchResult[] = getWordsByLevel(level)
  const filteredWords = levelWords.filter(
    (w) => w.word.includes(kanjiChar)
  )
  
  // SearchResult를 Word 타입으로 변환
  const items: Word[] = filteredWords.map((result, index) =>
    convertSearchResultToWord(result, `${level}_W_${String(index + 1).padStart(4, '0')}`, 1)
  )
  
  RELATED_WORD_CACHE.set(key, { timestamp: now, items })
  return items
}

interface ExampleCardProps {
  item: Word | Kanji
  type: 'word' | 'kanji'
  level: string
  isNew?: boolean
  cardState?: any // UserCardState | null
  onGrade: (grade: Grade) => void
  onNext: () => void
  allWords?: Word[] // 한자 학습 시 해당 한자가 포함된 단어 찾기용
  onGradeStateChange?: (selectedGrade: Grade | null, nextReviewInterval: number | null) => void
}

export const ExampleCard: React.FC<ExampleCardProps> = ({
  item,
  type,
  level,
  isNew = false,
  cardState = null,
  onGrade,
  onNext,
  allWords = [],
  onGradeStateChange,
}) => {
  const router = useRouter()
  const [showMeaning, setShowMeaning] = useState(false)
  const [showFurigana, setShowFurigana] = useState(false)
  const [showReadings, setShowReadings] = useState(false) // 음독/훈독 표시 여부
  const [examplePage, setExamplePage] = useState(0) // 예문 페이지네이션
  const [activeLevel, setActiveLevel] = useState<Level>('N5')

  const isReadingsVisible = showReadings || (showMeaning && showFurigana)

  const handleGrade = (grade: Grade) => {
    // 다음 복습 간격 계산 (실제 SRS 로직 사용)
    const updatedState = reviewCard(cardState as UserCardState | null, {
      itemId: item.id,
      type: type as 'word' | 'kanji',
      level: level as any,
      grade,
    })
    
    // 상태 변경 콜백 호출
    onGradeStateChange?.(grade, updatedState.interval)
    
    onGrade(grade)
    // 평가 후 자동으로 다음으로 이동
    setTimeout(() => {
      onNext()
    }, 300)
  }

  const handleReset = () => {
    setShowMeaning(false)
    setShowFurigana(false)
    setShowReadings(false)
  }

  const isWord = type === 'word'
  const word = isWord ? (item as Word) : null
  const kanji = !isWord ? (item as Kanji) : null

  // 카드 변경 시 레벨 탭 초기화
  useEffect(() => {
    if (kanji?.level) {
      setActiveLevel(kanji.level as Level)
    }
  }, [kanji?.character, kanji?.level])

  // 한자가 포함된 단어 찾기 (레벨 탭 + 캐시)
  const exampleWords = useMemo(() => {
    if (!kanji) return []
    const wordsWithKanji = getCachedRelatedWords(
      kanji.character,
      activeLevel
    )
    return wordsWithKanji.slice(0, 9) // 최대 9개 (3개씩 3페이지)
  }, [kanji, activeLevel])

  const wordsPerPage = 3
  const totalPages = Math.ceil(exampleWords.length / wordsPerPage)
  const currentPageWords = exampleWords.slice(
    examplePage * wordsPerPage,
    (examplePage + 1) * wordsPerPage
  )

  // 한자 학습 화면
  if (kanji) {
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
            {/* 눈 아이콘 (가리기/보이기 토글) */}
            <button
              onClick={() => setShowReadings(!showReadings)}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-page transition-colors"
            >
              <FontAwesomeIcon 
                icon={isReadingsVisible ? faEye : faEyeSlash} 
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
                  {kanji.meaningKo}
                </p>
              </div>

              {/* 음독/훈독 표시 (각각 별도 row, 좌측 정렬) */}
              <div className="mb-4 space-y-2 text-left">
                {kanji.onyomi && kanji.onyomi.length > 0 && (
                  <div className="flex items-center">
                    <span className="text-label text-text-sub mr-2">음독</span>
                    {showReadings || showFurigana ? (
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
                    {showReadings || showFurigana ? (
                      <span className="text-label text-jp font-medium text-text-main">
                        {kanji.kunyomi.join('・')}
                      </span>
                    ) : (
                      <span className="text-label text-text-sub">•••</span>
                    )}
                  </div>
                )}
              </div>

                {/* 레벨 탭 (N5~N1) */}
                <div className="mb-4 flex justify-center gap-2">
                  {(['N5', 'N4', 'N3', 'N2', 'N1'] as Level[]).map((lv) => (
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
                  ))}
                </div>
            </div>

            {/* 예문 단어 리스트 (3개씩 페이지네이션) */}
            {exampleWords.length > 0 && (
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
                      <LevelChip level={level as any} />
                      <span className="text-subtitle text-jp font-medium text-text-main flex-1">
                        {word.kanji || word.kana}
                      </span>
                      {showFurigana && word.kanji && (
                        <span className="text-label text-jp text-text-sub">
                          {word.kana}
                        </span>
                      )}
                      {showMeaning && (
                        <span className="text-body text-text-sub">
                          {word.meaningKo}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 하단 버튼 영역 (되돌리기, 의미, 히라가나만) */}
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

  // 단어 학습 화면 (기존 로직 유지)
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
          {word && (
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
          )}

          {/* 예문 표시 */}
          {word && word.examples && word.examples.length > 0 && (
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
                className="mb-4 text-center"
              >
                <p className="text-title text-text-main font-semibold mb-2">
                  {word ? word.meaningKo : kanji?.meaningKo}
                </p>
                {word && word.examples && word.examples[0] && (
                  <div className="text-body text-text-sub">
                    <p className="text-kr">{word.examples[0].ko}</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 하단 버튼 영역 (되돌리기, 의미, 히라가나만) */}
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

