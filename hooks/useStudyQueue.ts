/**
 * 학습 큐 로딩 커스텀 훅
 * 학습 큐를 로드하고 관리하는 로직을 추상화
 */
import { useState, useEffect } from 'react'
import { getTodayQueues, type StudyCard } from '@/lib/srs/studyQueue'
import type { Word, Kanji, JlptLevel } from '@/lib/types/content'
import { logger } from '@/lib/utils/logger'

interface UseStudyQueueOptions {
  /** 사용자 ID */
  uid: string | null
  /** 레벨 */
  level: JlptLevel
  /** 단어 목록 */
  words: Word[]
  /** 한자 목록 */
  kanjis: Kanji[]
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

  const loadQueue = async () => {
    if (!uid || !canLoad) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const queues = await getTodayQueues(
        uid,
        level,
        words,
        kanjis,
        dailyNewLimit
      )

      setQueue(queues.mixedQueue)
      setReviewCards(queues.reviewCards)
      setNewCards(queues.newCards)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load study queue')
      logger.error('Failed to load study queue:', error)
      setError(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadQueue()
  }, [uid, level, words, kanjis, dailyNewLimit, canLoad])

  return {
    queue,
    reviewCards,
    newCards,
    loading,
    error,
    refresh: loadQueue,
  }
}
