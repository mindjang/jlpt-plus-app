'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faRotateLeft, faFileLines, faEye, faEyeSlash, faFlag } from '@fortawesome/free-solid-svg-icons'
import type { NaverWord, WordDetails, Level } from '@/data/types'
import type { Grade, UserCardState } from '@/lib/types/srs'
import { getWordDetails } from '@/data/words/details/index'
import { ReportModal } from './ReportModal'
import { useAuth } from '@/components/auth/AuthProvider'
import { submitReport } from '@/lib/api/reports'

interface WordCardProps {
  word: NaverWord
  level: string
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
  level,
  isNew = false,
  cardState = null,
  onGrade,
  onNext,
  onGradeStateChange,
}: WordCardProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [showMeaning, setShowMeaning] = useState(false)
  const [showFurigana, setShowFurigana] = useState(false)
  const [wordDetails, setWordDetails] = useState<WordDetails | null>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [submittingReport, setSubmittingReport] = useState(false)

  // 한자 포함 여부 확인
  const hasKanji = /[\u4e00-\u9faf]/.test(word.entry)
  const displayText = word.entry
  const kanjiText = word.kanji || word.entry

  // 레벨 매핑
  const levelMap: Record<string, Level> = {
    '1': 'N1',
    '2': 'N2',
    '3': 'N3',
    '4': 'N4',
    '5': 'N5',
  }
  const jlptLevel = levelMap[word.level] || (level as Level) || 'N5'

  // 첫 번째 예문 가져오기
  const firstExample = wordDetails?.examples?.[0]

  // WordDetails 로드 (비동기, 블로킹하지 않음)
  useEffect(() => {
    let cancelled = false
    
    const loadDetails = async () => {
      setLoadingDetails(true)
      try {
        // API 호출을 즉시 시작 (병렬 처리 가능)
        const details = await getWordDetails(word.entry, jlptLevel)
        if (!cancelled) {
          setWordDetails(details)
        }
      } catch (error) {
        console.error('[WordCard] Error loading word details:', error)
        if (!cancelled) {
          setWordDetails(null)
        }
      } finally {
        if (!cancelled) {
          setLoadingDetails(false)
        }
      }
    }

    // 약간의 지연을 두어 UI가 먼저 렌더링되도록 (사용자 경험 개선)
    const timeoutId = setTimeout(() => {
      loadDetails()
    }, 50)

    return () => {
      cancelled = true
      clearTimeout(timeoutId)
    }
  }, [word.entry, jlptLevel])

  // 카드가 변경될 때 상태 초기화
  useEffect(() => {
    setShowMeaning(false)
    setShowFurigana(false)
    setWordDetails(null)
  }, [word.entry_id])

  // 모든 내용이 보이는지 확인 (눈 아이콘 상태용)
  const isAllVisible = showMeaning && showFurigana

  // 눈 아이콘 클릭: 모든 것을 한 번에 보이기/숨기기
  const handleToggleAll = () => {
    if (isAllVisible) {
      setShowMeaning(false)
      setShowFurigana(false)
    } else {
      setShowMeaning(true)
      setShowFurigana(true)
    }
  }

  const handleReset = () => {
    setShowMeaning(false)
    setShowFurigana(false)
  }

  // 신고 제출 핸들러
  const handleSubmitReport = async (report: { content: string; reason: string }) => {
    if (!user) {
      throw new Error('로그인이 필요합니다.')
    }

    setSubmittingReport(true)
    try {
      await submitReport(user, {
        contentType: 'word',
        contentText: report.content,
        level: jlptLevel,
        reason: report.reason,
      })

      // 성공 시 모달 닫기
      setShowReportModal(false)
    } finally {
      setSubmittingReport(false)
    }
  }

  return (
    <div className="w-full px-4 mx-auto flex-1 py-4">
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
          {/* 신고 아이콘 */}
          <button
            onClick={() => setShowReportModal(true)}
            className="w-8 h-8 flex items-center justify-center rounded-full active:bg-gray-100 border border-divider"
            title="신고하기"
          >
            <FontAwesomeIcon
              icon={faFlag}
              className="text-text-sub"
              size="2xs"
            />
          </button>
          {/* 눈 아이콘 (모든 내용 보이기/숨기기 토글) */}
          <button
            onClick={handleToggleAll}
            className="w-8 h-8 flex items-center justify-center rounded-full active:bg-gray-100 border border-divider"
          >
            <FontAwesomeIcon
              icon={isAllVisible ? faEye : faEyeSlash}
              className="text-text-sub"
              size="2xs"
            />
          </button>
          {/* 상세 아이콘 */}
          <button
            onClick={() => router.push(`/acquire/word/${encodeURIComponent(word.entry)}`)}
            className="h-8 px-2 gap-1 flex items-center justify-center rounded-full active:bg-gray-100 border border-divider"
          >
            <FontAwesomeIcon icon={faFileLines} className="text-text-sub" size="2xs" />
            <span className="text-xs">상세</span>
          </button>
        </div>

        {/* 카드 내용 - 상단 절반: 단어 정보 */}
        <div className="flex-1 flex flex-col justify-center p-6 pt-20">
          {/* 단어 표시 */}
          <div className="text-center mb-4">
            <h1 className="text-display-l text-jp font-medium text-text-main mb-3">
              {kanjiText}
            </h1>
            {showFurigana && (
              <p className="text-title text-jp text-text-sub mb-2">
                {displayText}
              </p>
            )}
            {!showFurigana && (
              <p className="text-title text-text-sub mb-2">•••</p>
            )}
          </div>

          {/* 의미 표시 */}
          <div className={`${showMeaning ? 'visible' : 'invisible'}`}>
            {word.partsMeans && word.partsMeans.length > 0 ? (
              <div className="space-y-2 text-center">
                {word.partsMeans[0].part && (
                  <span className="inline-block px-2 py-1 text-label font-medium text-text-sub bg-page rounded-md mb-2">
                    {word.partsMeans[0].part}
                  </span>
                )}
                {word.partsMeans[0].means && word.partsMeans[0].means.length > 0 && (
                  <p className="text-title text-text-main font-semibold">
                    {word.partsMeans[0].means[0]}
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center text-body text-text-sub">
                의미 정보가 없습니다
              </div>
            )}
          </div>
        </div>

        {/* 구분선 */}
        <div className="border-t border-gray-100"></div>

        {/* 카드 내용 - 하단 절반: 예문 */}
        <div className="flex-1 flex flex-col justify-center p-6 min-h-[200px]">
          {firstExample ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-3"
            >
              <div className="text-center">
                <p className="text-label text-text-sub mb-2">예문</p>
                <div 
                  className={`text-lg text-jp text-text-main mb-3 leading-relaxed [&_rt]:text-sm [&_rt]:font-medium [&_rt]:text-blue-400 ${!showFurigana ? '[&_rt]:invisible' : ''}`}
                  dangerouslySetInnerHTML={{ __html: firstExample.expExample1 }} 
                />
                <div className={`text-text-sub ${showMeaning ? 'visible' : 'invisible'}`}>
                  {firstExample.expExample2}
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="text-center text-body text-text-sub">
            </div>
          )}
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
            onClick={() => setShowFurigana(!showFurigana)}
            className={`button-press flex-1 py-3 px-4 rounded-lg text-body font-medium ${
              showFurigana
                ? 'bg-primary text-white'
                : 'bg-surface border border-gray-400 text-text-main'
            }`}
          >
            히라가나
          </button>
        </div>
      </motion.div>

      {/* 신고 모달 */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        contentType="word"
        contentText={word.entry}
        level={jlptLevel}
        onSubmit={handleSubmitReport}
      />
    </div>
  )
}
