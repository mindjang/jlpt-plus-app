/**
 * 학습 진행률 계산 커스텀 훅
 * 진행률 통계, 회차 진행률, 챕터별 진행률 등을 계산
 * 중복 요청 방지 및 자동 취소 기능 포함
 */
import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { deduplicateRequest } from '@/lib/utils/requestDeduplication'
import { getLevelProgress, getTodayQueues } from '@/lib/srs/queue/studyQueue'
import {
  calculateProgressStats,
  calculateRoundProgress,
  calculateChapterProgress,
} from '@/lib/srs/progress/progressCalculation'
import { getCardsByLevel } from '@/lib/firebase/firestore'
import { nowAsMinutes, minutesToDays } from '@/lib/utils/date/dateUtils'
import { normalizeDue } from '@/lib/srs/migration/cardMigration'
import type { JlptLevel } from '@/lib/types/content'
import type { KanjiAliveEntry } from '@/data/types'
import type { NaverWord } from '@/data/types'
import { getKanjiId } from '@/lib/data/kanji/kanjiHelpers'
import { logger } from '@/lib/utils/logger'

interface UseStudyProgressOptions {
  /** 사용자 ID */
  uid: string | null
  /** 레벨 */
  level: JlptLevel
  /** 활성 탭 (word | kanji) */
  activeTab: 'word' | 'kanji'
  /** 단어 목록 */
  words: NaverWord[]
  /** 한자 목록 */
  kanjis: KanjiAliveEntry[]
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
  const abortControllerRef = useRef<AbortController | null>(null)
  const wordsDataRef = useRef<NaverWord[]>([])
  const kanjisDataRef = useRef<KanjiAliveEntry[]>([])
  const wordsLengthRef = useRef(0)
  const kanjisLengthRef = useRef(0)

  // words/kanjis 데이터를 ref에 저장 (의존성 배열 문제 해결)
  useEffect(() => {
    wordsDataRef.current = words
    kanjisDataRef.current = kanjis
    wordsLengthRef.current = words.length
    kanjisLengthRef.current = kanjis.length
  }, [words, kanjis])

  // 중복 방지가 적용된 진행률 로드 함수 (메모이제이션)
  const loadProgressDeduplicated = useMemo(
    () => deduplicateRequest(
      async (
        uid: string,
        level: JlptLevel,
        activeTab: 'word' | 'kanji',
        totalWords: number
      ) => {
        // 1. 학습한 카드 수 가져오기
        const progress = await getLevelProgress(
          uid,
          level,
          activeTab === 'word' ? totalWords : 0,
          activeTab === 'kanji' ? totalWords : 0
        )

        // 2. 장기 기억 카드 수 및 오늘 새로 학습한 카드 수 계산
        const levelCardsMap = await getCardsByLevel(uid, level)

        return { progress, levelCardsMap }
      },
      {
        keyGenerator: (uid, level, activeTab, totalWords) => {
          return `progress:${uid}:${level}:${activeTab}:${totalWords}`
        },
        ttl: 3000, // 3초간 캐시
        removeOnError: true,
      }
    ),
    [uid, level, activeTab, totalWords]
  )

  // 중복 방지가 적용된 큐 로드 함수 (메모이제이션)
  const loadQueuesDeduplicated = useMemo(
    () => deduplicateRequest(
      async (
        uid: string,
        level: JlptLevel,
        words: NaverWord[],
        kanjis: KanjiAliveEntry[],
        targetAmount: number
      ) => {
        return await getTodayQueues(uid, level, words, kanjis, targetAmount)
      },
      {
        keyGenerator: (uid, level, words, kanjis, targetAmount) => {
          // words/kanjis 배열의 길이만 사용하여 키 생성 (배열 내용 변경 감지 최소화)
          return `queues:${uid}:${level}:${words.length}:${kanjis.length}:${targetAmount}`
        },
        ttl: 5000, // 5초간 캐시
        removeOnError: true,
      }
    ),
    [uid, level, targetAmount]
  )

  const loadProgress = useCallback(async () => {
    if (!uid || !canLoad) {
      setLoading(false)
      return
    }

    // ref에서 최신 데이터 가져오기
    const currentWords = wordsDataRef.current
    const currentKanjis = kanjisDataRef.current
    const items = activeTab === 'word' ? currentWords : currentKanjis

    // words/kanjis가 아직 로드되지 않았으면 로딩 상태 유지
    if (items.length === 0) {
      setLoading(true)
      return
    }

    // 이전 요청 취소
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // 새 AbortController 생성
    const abortController = new AbortController()
    abortControllerRef.current = abortController

    try {
      setLoading(true)
      setError(null)

      const { progress, levelCardsMap } = await loadProgressDeduplicated(
        uid,
        level,
        activeTab,
        totalWords
      )

      // 요청이 취소되지 않았는지 확인
      if (abortController.signal.aborted) {
        return
      }

      const learned = activeTab === 'word' ? progress.learnedWords : progress.learnedKanjis
      setCurrentProgress(learned)
      const levelCards = Array.from(levelCardsMap.values())

      // 진행률 통계 계산
      const progressStats = calculateProgressStats(levelCards, activeTab)
      setLongTermMemory(progressStats.longTermMemory)

      // 회차 진행률 계산 (전체 학습량 기반으로 누적 회차 계산)
      const roundProgress = calculateRoundProgress(
        progressStats.todayNewStudied,
        targetAmount,
        studyRoundRef.current,
        learned // 전체 학습한 카드 수 (누적)
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
      let availableToday = 0
      if (items.length > 0) {
        const queues = await loadQueuesDeduplicated(
          uid,
          level,
          currentWords,
          currentKanjis,
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
        const chapterItemIds = new Set(
          chapterItems.map((item, idx) => {
            if (activeTab === 'word') {
              return (item as NaverWord).entry_id
            } else {
              // KanjiAliveEntry의 경우 ID 생성
              const kanji = item as KanjiAliveEntry
              const globalIndex = startIndex + idx
              return getKanjiId(kanji, level, globalIndex)
            }
          })
        )

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
      // AbortError는 무시 (의도적인 취소)
      if (err instanceof Error && err.name === 'AbortError') {
        return
      }

      // 요청이 취소되지 않았을 때만 에러 설정
      if (!abortController.signal.aborted) {
      const error = err instanceof Error ? err : new Error('Failed to load progress')
      logger.error('Failed to load progress:', error)
      setError(error)
      }
    } finally {
      if (!abortController.signal.aborted) {
      setLoading(false)
      }
    }
  }, [uid, level, activeTab, totalWords, targetAmount, canLoad, loadProgressDeduplicated, loadQueuesDeduplicated])

  // words/kanjis 길이 변경 추적
  const prevWordsLengthRef = useRef(-1)
  const prevKanjisLengthRef = useRef(-1)
  const prevActiveTabRef = useRef<'word' | 'kanji' | null>(null)
  const prevLevelRef = useRef<JlptLevel | null>(null)
  const isInitialMountRef = useRef(true)

  useEffect(() => {
    // 초기 마운트 시 또는 실제 변경이 있을 때만 실행
    const isInitialMount = isInitialMountRef.current
    const wordsLengthChanged = words.length !== prevWordsLengthRef.current
    const kanjisLengthChanged = kanjis.length !== prevKanjisLengthRef.current
    const activeTabChanged = activeTab !== prevActiveTabRef.current
    const levelChanged = level !== prevLevelRef.current

    // words/kanjis가 0에서 0이 아닌 값으로 변경되었거나, 다른 변경사항이 있을 때 실행
    const items = activeTab === 'word' ? words : kanjis
    const itemsLengthChanged = activeTab === 'word' ? wordsLengthChanged : kanjisLengthChanged
    const prevItemsLength = activeTab === 'word' ? prevWordsLengthRef.current : prevKanjisLengthRef.current
    
    // 데이터가 로드되었는지 확인 (0에서 0이 아닌 값으로 변경)
    const dataLoaded = itemsLengthChanged && prevItemsLength === 0 && items.length > 0
    
    const shouldLoad = isInitialMount || 
      dataLoaded ||
      (itemsLengthChanged && items.length > 0) || 
      activeTabChanged || 
      levelChanged

    if (shouldLoad) {
      isInitialMountRef.current = false
      prevWordsLengthRef.current = words.length
      prevKanjisLengthRef.current = kanjis.length
      prevActiveTabRef.current = activeTab
      prevLevelRef.current = level
      
      // words/kanjis가 로드되었을 때만 loadProgress 호출
      if (items.length > 0) {
        loadProgress()
      }
    }

    // 컴포넌트 언마운트 시 요청 취소
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [loadProgress, words.length, kanjis.length, activeTab, level])

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
