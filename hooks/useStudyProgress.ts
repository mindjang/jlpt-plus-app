/**
 * 학습 진행률 계산 커스텀 훅
 * 진행률 통계, 회차 진행률, 챕터별 진행률 등을 계산
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import { getLevelProgress, getTodayQueues } from '@/lib/srs/studyQueue'
import {
  calculateProgressStats,
  calculateRoundProgress,
  calculateChapterProgress,
} from '@/lib/srs/progressCalculation'
import { getCardsByLevel } from '@/lib/firebase/firestore'
import { nowAsMinutes, dayNumberToMinutes, minutesToDays } from '@/lib/utils/dateUtils'
import { normalizeDue } from '@/lib/srs/cardMigration'
import type { Word, Kanji, JlptLevel } from '@/lib/types/content'
import { logger } from '@/lib/utils/logger'

interface UseStudyProgressOptions {
  /** 사용자 ID */
  uid: string | null
  /** 레벨 */
  level: JlptLevel
  /** 활성 탭 (word | kanji) */
  activeTab: 'word' | 'kanji'
  /** 단어 목록 */
  words: Word[]
  /** 한자 목록 */
  kanjis: Kanji[]
  /** 전체 단어/한자 수 */
  totalWords: number
  /** 목표 학습량 */
  targetAmount: number
  /** 로딩 가능 여부 */
  canLoad?: boolean
}

interface UseStudyProgressResult {
  /** 현재 진행률 (학습한 카드 수) */
  currentProgress: number
  /** 장기 기억 카드 수 */
  longTermMemory: number
  /** 오늘 새로 학습한 카드 수 */
  todayNewStudied: number
  /** 새 카드 수 */
  newWords: number
  /** 복습 카드 수 */
  reviewWords: number
  /** 학습 회차 */
  studyRound: number
  /** 현재 회차 진행률 */
  sessionProgress: number
  /** 다음 복습까지 남은 일수 */
  nextReviewDays: number | null
  /** 세션 분모 고정값 */
  sessionTotalFixed: number
  /** 챕터별 진행률 데이터 */
  chaptersData: Array<{
    number: number
    totalWords: number
    longTermMemory: number
    learned: number
  }>
  /** 로딩 중 여부 */
  loading: boolean
  /** 에러 */
  error: Error | null
  /** 진행률 새로고침 */
  refresh: () => Promise<void>
}

/**
 * 학습 진행률을 계산하고 관리하는 커스텀 훅
 */
export function useStudyProgress({
  uid,
  level,
  activeTab,
  words,
  kanjis,
  totalWords,
  targetAmount,
  canLoad = true,
}: UseStudyProgressOptions): UseStudyProgressResult {
  const [currentProgress, setCurrentProgress] = useState(0)
  const [newWords, setNewWords] = useState(0)
  const [reviewWords, setReviewWords] = useState(0)
  const [longTermMemory, setLongTermMemory] = useState(0)
  const [sessionProgress, setSessionProgress] = useState(0)
  const [studyRound, setStudyRound] = useState(1)
  const [nextReviewDays, setNextReviewDays] = useState<number | null>(null)
  const [sessionTotalFixed, setSessionTotalFixed] = useState<number>(targetAmount)
  const [chaptersData, setChaptersData] = useState<Array<{
    number: number
    totalWords: number
    longTermMemory: number
    learned: number
  }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const studyRoundRef = useRef(1)

  const loadProgress = useCallback(async () => {
    if (!uid || !canLoad) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // 1. 학습한 카드 수 가져오기
      const progress = await getLevelProgress(
        uid,
        level,
        activeTab === 'word' ? totalWords : 0,
        activeTab === 'kanji' ? totalWords : 0
      )

      const learned = activeTab === 'word' ? progress.learnedWords : progress.learnedKanjis
      setCurrentProgress(learned)

      // 2. 장기 기억 카드 수 및 오늘 새로 학습한 카드 수 계산
      const levelCardsMap = await getCardsByLevel(uid, level)
      const levelCards = Array.from(levelCardsMap.values())

      // 진행률 통계 계산
      const progressStats = calculateProgressStats(levelCards, activeTab)
      setLongTermMemory(progressStats.longTermMemory)

      // 회차 진행률 계산
      const roundProgress = calculateRoundProgress(
        progressStats.todayNewStudied,
        targetAmount,
        studyRoundRef.current
      )

      // 학습 회차 업데이트
      setStudyRound((prev) => {
        const newRound = Math.max(prev, roundProgress.currentRound)
        studyRoundRef.current = newRound
        return newRound
      })

      // 현재 회차 진행률 설정
      setSessionProgress(roundProgress.currentRoundProgress)

      // 3. 새 카드/복습 카드 수 가져오기
      const items = activeTab === 'word' ? words : kanjis
      let availableToday = 0
      if (items.length > 0) {
        const queues = await getTodayQueues(
          uid,
          level,
          words,
          kanjis,
          targetAmount
        )
        setNewWords(queues.newCards.filter(c => c.type === activeTab).length)
        setReviewWords(queues.reviewCards.filter(c => c.type === activeTab).length)
        availableToday = queues.mixedQueue.length
      }

      // 세션 분모 고정
      const remainingCards = Math.max(totalWords - learned, 0)
      const fallbackTotal = remainingCards > 0 ? Math.min(targetAmount, remainingCards) : targetAmount
      const initialFixed = availableToday > 0 ? Math.min(targetAmount, availableToday) : fallbackTotal
      setSessionTotalFixed((prev) => (prev === null ? initialFixed : prev))

      // 4. 미래 복습까지 남은 일수 계산
      const nowMinutesLocal = nowAsMinutes()
      let minFutureDays: number | null = null
      levelCards.forEach((card) => {
        if (card.type === activeTab) {
          const dueMinutes = normalizeDue(card.due)
          const diff = dueMinutes - nowMinutesLocal
          if (diff > 0) {
            const days = minutesToDays(diff)
            if (minFutureDays === null || days < minFutureDays) {
              minFutureDays = days
            }
          }
        }
      })
      setNextReviewDays(minFutureDays)

      // 5. 챕터별 진행률 계산
      const totalChapters = Math.ceil(totalWords / targetAmount)
      const chaptersProgress: Array<{
        number: number
        totalWords: number
        longTermMemory: number
        learned: number
      }> = []

      for (let i = 0; i < totalChapters; i++) {
        const startIndex = i * targetAmount
        const endIndex = Math.min(startIndex + targetAmount, items.length)
        const chapterItems = items.slice(startIndex, endIndex)
        const chapterItemIds = new Set(chapterItems.map((item) => item.id))

        const chapterProgress = calculateChapterProgress(
          levelCards,
          chapterItemIds,
          activeTab
        )

        chaptersProgress.push({
          number: i + 1,
          totalWords: chapterItems.length,
          longTermMemory: chapterProgress.longTermMemory,
          learned: chapterProgress.learned,
        })
      }

      setChaptersData(chaptersProgress)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load progress')
      logger.error('Failed to load progress:', error)
      setError(error)
    } finally {
      setLoading(false)
    }
  }, [uid, level, activeTab, words, kanjis, totalWords, targetAmount, canLoad])

  useEffect(() => {
    loadProgress()
  }, [loadProgress])

  return {
    currentProgress,
    longTermMemory,
    todayNewStudied: sessionProgress,
    newWords,
    reviewWords,
    studyRound,
    sessionProgress,
    nextReviewDays,
    sessionTotalFixed,
    chaptersData,
    loading,
    error,
    refresh: loadProgress,
  }
}
