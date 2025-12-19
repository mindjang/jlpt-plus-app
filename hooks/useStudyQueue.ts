/**
 * 학습 큐 로딩 커스텀 훅
 * 학습 큐를 로드하고 관리하는 로직을 추상화
 * 중복 요청 방지 및 자동 취소 기능 포함
 */
import { useState, useEffect, useRef } from 'react'
import { logger } from '@/lib/utils/logger'
import { deduplicateRequest } from '@/lib/utils/requestDeduplication'
import type { JlptLevel } from '@/lib/types/content'
import type { KanjiAliveEntry } from '@/data/types'
import type { NaverWord } from '@/data/types'
import type { StudyCard } from '@/lib/types/srs'
import { getTodayQueues } from '@/lib/srs/queue/studyQueue'

interface UseStudyQueueOptions {
  /** 사용자 ID */
  uid: string | null
  /** 레벨 */
  level: JlptLevel
  /** 단어 목록 */
  words: NaverWord[]
  /** 한자 목록 */
  kanjis: KanjiAliveEntry[]
  /** 일일 새 카드 제한 */
  dailyNewLimit?: number
  /** 로딩 가능 여부 */
  canLoad?: boolean
}

interface UseStudyQueueResult {
  /** 학습 큐 */
  queue: StudyCard[]
  /** 복습 카드 목록 */
  reviewCards: StudyCard[]
  /** 새 카드 목록 */
  newCards: StudyCard[]
  /** 로딩 중 여부 */
  loading: boolean
  /** 에러 */
  error: Error | null
  /** 큐 새로고침 */
  refresh: () => Promise<void>
}

/**
 * 학습 큐를 로드하고 관리하는 커스텀 훅
 */
// 중복 방지가 적용된 큐 로드 함수
const loadQueueDeduplicated = deduplicateRequest(
  async (
    uid: string,
    level: JlptLevel,
    words: NaverWord[],
    kanjis: KanjiAliveEntry[],
    dailyNewLimit: number
  ) => {
    return await getTodayQueues(uid, level, words, kanjis, dailyNewLimit)
  },
  {
    keyGenerator: (uid, level, words, kanjis, dailyNewLimit) => {
      // 요청 키 생성: uid + level + words/kanjis 해시 + dailyNewLimit
      const wordsHash = words.length > 0 
        ? `${words.length}-${words[0]?.entry_id || ''}`
        : '0'
      const kanjisHash = kanjis.length > 0
        ? `${kanjis.length}-${kanjis[0]?.ka_utf || kanjis[0]?.kanji?.character || ''}`
        : '0'
      return `queue:${uid}:${level}:${wordsHash}:${kanjisHash}:${dailyNewLimit}`
    },
    ttl: 2000, // 2초간 캐시 (같은 요청은 재사용)
    removeOnError: true,
  }
)

export function useStudyQueue({
  uid,
  level,
  words,
  kanjis,
  dailyNewLimit = 10,
  canLoad = true,
}: UseStudyQueueOptions): UseStudyQueueResult {
  const [queue, setQueue] = useState<StudyCard[]>([])
  const [reviewCards, setReviewCards] = useState<StudyCard[]>([])
  const [newCards, setNewCards] = useState<StudyCard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const loadQueue = async () => {
    if (!uid || !canLoad) {
      setLoading(false)
      return
    }

    // 이전 요청 취소
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // 새 AbortController 생성
    const abortController = new AbortController()
    abortControllerRef.current = abortController

    setLoading(true)
    setError(null)

    try {
      const queues = await loadQueueDeduplicated(uid, level, words, kanjis, dailyNewLimit)

      // 요청이 취소되지 않았는지 확인
      if (!abortController.signal.aborted) {
      setQueue(queues.mixedQueue)
      setReviewCards(queues.reviewCards)
      setNewCards(queues.newCards)
      }
    } catch (err) {
      // AbortError는 무시 (의도적인 취소)
      if (err instanceof Error && err.name === 'AbortError') {
        return
      }

      // 요청이 취소되지 않았을 때만 에러 설정
      if (!abortController.signal.aborted) {
      const error = err instanceof Error ? err : new Error('Failed to load study queue')
      logger.error('Failed to load study queue:', error)
      setError(error)
      }
    } finally {
      if (!abortController.signal.aborted) {
      setLoading(false)
      }
    }
  }

  useEffect(() => {
    loadQueue()

    // 컴포넌트 언마운트 시 요청 취소
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [
    uid,
    level,
    words.length,
    kanjis.length,
    words[0]?.entry_id || '',
    kanjis[0]?.ka_utf || kanjis[0]?.kanji?.character || '',
    dailyNewLimit,
    canLoad,
  ])

  return {
    queue,
    reviewCards,
    newCards,
    loading,
    error,
    refresh: loadQueue,
  }
}
