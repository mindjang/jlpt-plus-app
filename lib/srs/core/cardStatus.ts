// 카드 상태 판정 로직
import type { UserCardState, CardStatus } from '../../types/srs'
import { nowAsMinutes, daysToMinutes } from '../../utils/date/dateUtils'
import { normalizeDue, normalizeInterval } from '../migration/cardMigration'

/**
 * 카드 상태 판정
 */
export function getCardStatus(card: UserCardState | null): CardStatus {
  if (!card) {
    return 'new'
  }

  // Leech: lapses >= 8 (일본어 학습에 맞춘 기준)
  if (card.lapses >= 8) {
    return 'leech'
  }

  const nowMinutes = nowAsMinutes()
  
  // 기존 일 단위 데이터 마이그레이션
  const dueMinutes = normalizeDue(card.due)
  const intervalMinutes = normalizeInterval(card.interval)

  // Mastered: interval >= 30일 (43200분) 또는 reps >= 12 (실제 장기 기억 기준)
  const thirtyDaysInMinutes = daysToMinutes(30)
  if (intervalMinutes >= thirtyDaysInMinutes || card.reps >= 12) {
    return 'mastered'
  }

  // Review: due <= 현재 시각
  if (dueMinutes <= nowMinutes) {
    return 'review'
  }

  // Learning: reps가 적고 interval이 작을 때 (3일 = 4320분 미만)
  const threeDaysInMinutes = daysToMinutes(3)
  if (card.reps < 3 && intervalMinutes < threeDaysInMinutes) {
    return 'learning'
  }

  // 기본적으로 review로 처리
  return 'review'
}

