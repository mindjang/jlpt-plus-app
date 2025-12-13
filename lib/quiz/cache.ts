/**
 * 퀴즈 시스템 캐싱 유틸리티
 */
import type { UserQuizLevel, QuizStats, ItemStats } from '@/lib/types/quiz'
import type { JlptLevel } from '@/lib/types/content'

// 메모리 캐시
const userLevelCache = new Map<string, { data: UserQuizLevel; timestamp: number }>()
const statsCache = new Map<string, { data: QuizStats; timestamp: number }>()
const itemStatsCache = new Map<string, { data: Record<string, ItemStats>; timestamp: number }>()

// 캐시 유효 시간 (밀리초)
const CACHE_TTL = 5 * 60 * 1000 // 5분

/**
 * 사용자 레벨 캐시 가져오기
 */
export function getCachedUserLevel(uid: string): UserQuizLevel | null {
  const cached = userLevelCache.get(uid)
  if (!cached) return null

  const now = Date.now()
  if (now - cached.timestamp > CACHE_TTL) {
    userLevelCache.delete(uid)
    return null
  }

  return cached.data
}

/**
 * 사용자 레벨 캐시 저장
 */
export function setCachedUserLevel(uid: string, data: UserQuizLevel): void {
  userLevelCache.set(uid, { data, timestamp: Date.now() })
}

/**
 * 통계 캐시 가져오기
 */
export function getCachedStats(uid: string, level: JlptLevel): QuizStats | null {
  const key = `${uid}:${level}`
  const cached = statsCache.get(key)
  if (!cached) return null

  const now = Date.now()
  if (now - cached.timestamp > CACHE_TTL) {
    statsCache.delete(key)
    return null
  }

  return cached.data
}

/**
 * 통계 캐시 저장
 */
export function setCachedStats(uid: string, level: JlptLevel, data: QuizStats): void {
  const key = `${uid}:${level}`
  statsCache.set(key, { data, timestamp: Date.now() })
}

/**
 * 아이템 통계 캐시 가져오기
 */
export function getCachedItemStats(uid: string, level: JlptLevel): Record<string, ItemStats> | null {
  const key = `${uid}:${level}`
  const cached = itemStatsCache.get(key)
  if (!cached) return null

  const now = Date.now()
  if (now - cached.timestamp > CACHE_TTL) {
    itemStatsCache.delete(key)
    return null
  }

  return cached.data
}

/**
 * 아이템 통계 캐시 저장
 */
export function setCachedItemStats(uid: string, level: JlptLevel, data: Record<string, ItemStats>): void {
  const key = `${uid}:${level}`
  itemStatsCache.set(key, { data, timestamp: Date.now() })
}

/**
 * 모든 캐시 초기화
 */
export function clearAllCaches(): void {
  userLevelCache.clear()
  statsCache.clear()
  itemStatsCache.clear()
}

/**
 * 특정 사용자 캐시 초기화
 */
export function clearUserCaches(uid: string): void {
  // 사용자 레벨 캐시
  userLevelCache.delete(uid)

  // 통계 캐시
  const levels: JlptLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1']
  levels.forEach((level) => {
    const statsKey = `${uid}:${level}`
    statsCache.delete(statsKey)
    itemStatsCache.delete(statsKey)
  })
}

