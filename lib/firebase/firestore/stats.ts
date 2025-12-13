/**
 * 통계 관리 (Firestore CRUD)
 */
import { doc, getDoc, setDoc, type Firestore } from 'firebase/firestore'
import type { LevelStats } from '../../types/stats'
import { LONG_TERM_MEMORY_INTERVAL_DAYS, LONG_TERM_MEMORY_REPS } from '../../srs/constants'
import { getDbInstance } from './utils'
import { getCardsByLevel } from './cards'

const statsDocRef = (dbInstance: Firestore, uid: string, level: string) =>
  doc(dbInstance, 'users', uid, 'stats', level)

/**
 * 레벨별 통계 가져오기
 */
export async function getLevelStats(uid: string, level: string): Promise<LevelStats | null> {
  const dbInstance = getDbInstance()
  const ref = statsDocRef(dbInstance, uid, level)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  return snap.data() as LevelStats
}

/**
 * 레벨별 통계 초기화
 */
export async function initializeLevelStats(uid: string, level: string): Promise<LevelStats> {
  const dbInstance = getDbInstance()
  const ref = statsDocRef(dbInstance, uid, level)

  const initialStats: LevelStats = {
    level: level as any,
    wordStats: {
      total: 0,
      new: 0,
      learning: 0,
      review: 0,
      longTermMemory: 0,
    },
    kanjiStats: {
      total: 0,
      new: 0,
      learning: 0,
      review: 0,
      longTermMemory: 0,
    },
    lastUpdated: Date.now(),
  }

  await setDoc(ref, initialStats)
  return initialStats
}

/**
 * 레벨 통계 업데이트 (증감량 적용)
 */
export async function updateLevelStats(
  uid: string,
  level: string,
  cardType: 'word' | 'kanji',
  updates: {
    totalDelta?: number
    newDelta?: number
    learningDelta?: number
    reviewDelta?: number
    longTermMemoryDelta?: number
  }
): Promise<void> {
  const dbInstance = getDbInstance()
  const ref = statsDocRef(dbInstance, uid, level)

  // 현재 통계 가져오기
  const snap = await getDoc(ref)
  const current = snap.exists() ? (snap.data() as LevelStats) : null

  const statsType = cardType === 'word' ? 'wordStats' : 'kanjiStats'
  
  // 기본값 설정
  const currentStats = current?.[statsType] || {
    total: 0,
    new: 0,
    learning: 0,
    review: 0,
    longTermMemory: 0,
  }

  // 업데이트 객체 생성 (중첩된 필드 올바르게 처리)
  const updateObj: any = {
    lastUpdated: Date.now(),
    [statsType]: {
      ...currentStats,
    },
  }

  // 증감량 적용
  if (updates.totalDelta !== undefined) {
    updateObj[statsType].total = currentStats.total + updates.totalDelta
  }
  if (updates.newDelta !== undefined) {
    updateObj[statsType].new = currentStats.new + updates.newDelta
  }
  if (updates.learningDelta !== undefined) {
    updateObj[statsType].learning = currentStats.learning + updates.learningDelta
  }
  if (updates.reviewDelta !== undefined) {
    updateObj[statsType].review = currentStats.review + updates.reviewDelta
  }
  if (updates.longTermMemoryDelta !== undefined) {
    updateObj[statsType].longTermMemory = currentStats.longTermMemory + updates.longTermMemoryDelta
  }

  // 다른 statsType도 유지 (덮어쓰기 방지)
  if (current) {
    const otherStatsType = cardType === 'word' ? 'kanjiStats' : 'wordStats'
    updateObj[otherStatsType] = current[otherStatsType]
    updateObj.level = current.level
  } else {
    updateObj.level = level as any
    // 초기화되지 않은 경우 다른 statsType도 초기화
    const otherStatsType = cardType === 'word' ? 'kanjiStats' : 'wordStats'
    updateObj[otherStatsType] = {
      total: 0,
      new: 0,
      learning: 0,
      review: 0,
      longTermMemory: 0,
    }
  }

  await setDoc(ref, updateObj, { merge: true })
}

/**
 * 레벨 통계 재계산 (모든 카드 재집계)
 * 마이그레이션 또는 데이터 불일치 발생 시 사용
 */
export async function recalculateLevelStats(uid: string, level: string): Promise<LevelStats> {
  const dbInstance = getDbInstance()
  const cardsMap = await getCardsByLevel(uid, level, 1000)
  const nowMinutes = Math.floor(Date.now() / (1000 * 60))

  const wordStats = {
    total: 0,
    new: 0,
    learning: 0,
    review: 0,
    longTermMemory: 0,
  }

  const kanjiStats = {
    total: 0,
    new: 0,
    learning: 0,
    review: 0,
    longTermMemory: 0,
  }

  cardsMap.forEach((card) => {
    const stats = card.type === 'word' ? wordStats : kanjiStats
    stats.total++

    // 카드 상태 판정
    const intervalDays = card.interval / (24 * 60)

    if (intervalDays >= LONG_TERM_MEMORY_INTERVAL_DAYS || card.reps >= LONG_TERM_MEMORY_REPS) {
      stats.longTermMemory++
    } else if (intervalDays >= 1) {
      stats.learning++
    }

    if (card.due <= nowMinutes && !card.suspended) {
      stats.review++
    }
  })

  const newStats: LevelStats = {
    level: level as any,
    wordStats,
    kanjiStats,
    lastUpdated: Date.now(),
  }

  const ref = statsDocRef(dbInstance, uid, level)
  await setDoc(ref, newStats)

  return newStats
}

