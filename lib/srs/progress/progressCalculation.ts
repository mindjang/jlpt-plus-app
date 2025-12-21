/**
 * 학습 진행률 계산 로직
 * 모든 학습 모드에서 재사용 가능
 */
import type { UserCardState } from '../../types/srs'
import type { ProgressStats, RoundProgress } from '../../types/stats'
import { nowAsMinutes, daysToMinutes } from '../../utils/date/dateUtils'
import { migrateCardState } from '../migration/cardMigration'
import { LONG_TERM_MEMORY_INTERVAL_DAYS, LONG_TERM_MEMORY_REPS } from '../constants'

/**
 * 카드가 장기 기억인지 판정
 * @param card 카드 상태
 * @returns 장기 기억 여부
 */
export function isLongTermMemory(card: UserCardState): boolean {
  const migrated = migrateCardState(card)
  const longTermIntervalMinutes = daysToMinutes(LONG_TERM_MEMORY_INTERVAL_DAYS)
  return migrated.interval >= longTermIntervalMinutes || card.reps >= LONG_TERM_MEMORY_REPS
}

/**
 * 카드가 오늘 학습했는지 판정
 * @param card 카드 상태
 * @returns 오늘 학습 여부
 */
export function isStudiedToday(card: UserCardState): boolean {
  const nowMinutes = nowAsMinutes()
  const migrated = migrateCardState(card)
  const oneDayInMinutes = daysToMinutes(1)
  return Math.abs(nowMinutes - migrated.lastReviewed) < oneDayInMinutes
}

/**
 * 레벨별 카드들의 진행률 통계 계산
 * @param cards 카드 상태 배열
 * @param type 필터링할 타입 ('word' | 'kanji' | null = 모두)
 * @returns 진행률 통계
 */
export function calculateProgressStats(
  cards: UserCardState[],
  type: 'word' | 'kanji' | null = null
): ProgressStats {
  const filteredCards = type
    ? cards.filter((card) => card.type === type)
    : cards

  let longTermMemory = 0
  let todayNewStudied = 0

  filteredCards.forEach((card) => {
    if (isLongTermMemory(card)) {
      longTermMemory++
    }
    if (isStudiedToday(card)) {
      todayNewStudied++
    }
  })

  return {
    longTermMemory,
    todayNewStudied,
    learned: filteredCards.length,
  }
}

/**
 * 회차 진행률 계산
 * @param todayNewStudied 오늘 새로 학습한 카드 수
 * @param targetAmount 목표 학습량 (회차당)
 * @param currentRound 현재 회차 (선택적, 없으면 자동 계산)
 * @param totalLearned 전체 학습한 카드 수 (누적 회차 계산용, 선택적)
 * @returns 회차 진행률 정보
 */
export function calculateRoundProgress(
  todayNewStudied: number,
  targetAmount: number,
  currentRound?: number,
  totalLearned?: number
): RoundProgress {
  // 전체 학습량 기반 회차 계산 (누적)
  let calculatedRound = 1
  if (totalLearned !== undefined && totalLearned > 0) {
    const completedRounds = Math.floor(totalLearned / targetAmount)
    calculatedRound = completedRounds > 0 ? completedRounds + 1 : 1
  } else {
    // 전체 학습량이 없으면 오늘 학습량 기반으로 계산 (하위 호환)
    const completedRounds = Math.floor(todayNewStudied / targetAmount)
    calculatedRound = completedRounds > 0 ? completedRounds + 1 : 1
  }

  const finalRound = currentRound ? Math.max(currentRound, calculatedRound) : calculatedRound
  
  // 현재 회차의 시작점 계산 (누적 기준)
  const previousRoundsTotal = totalLearned !== undefined 
    ? Math.floor((finalRound - 1) * targetAmount)
    : (finalRound - 1) * targetAmount
  
  // 현재 회차 진행률: 전체 학습량 기준으로 계산
  const currentRoundProgress = totalLearned !== undefined
    ? Math.max(0, Math.min(totalLearned - previousRoundsTotal, targetAmount))
    : Math.max(0, Math.min(todayNewStudied - previousRoundsTotal, targetAmount))

  return {
    currentRound: finalRound,
    currentRoundProgress,
    completedRounds: Math.floor((totalLearned ?? todayNewStudied) / targetAmount),
  }
}

/**
 * 챕터별 진행률 계산
 * @param cards 카드 상태 배열
 * @param chapterItems 챕터에 속한 아이템 ID 집합
 * @param type 필터링할 타입 ('word' | 'kanji')
 * @returns 챕터별 통계
 */
export function calculateChapterProgress(
  cards: UserCardState[],
  chapterItems: Set<string>,
  type: 'word' | 'kanji'
): {
  learned: number
  longTermMemory: number
} {
  let learned = 0
  let longTermMemory = 0

  cards.forEach((card) => {
    if (card.type === type && chapterItems.has(card.itemId)) {
      learned++
      if (isLongTermMemory(card)) {
        longTermMemory++
      }
    }
  })

  return {
    learned,
    longTermMemory,
  }
}

