// 카드 상태 판정 로직
import type { UserCardState, CardStatus } from '../types/srs'
import { nowAsMinutes, daysToMinutes } from './reviewCard'

/**
 * 카드 상태 판정
 */
export function getCardStatus(card: UserCardState | null): CardStatus {
  if (!card) {
    return 'new'
  }

  // Leech: lapses >= 5
  if (card.lapses >= 5) {
    return 'leech'
  }

  const nowMinutes = nowAsMinutes()
  
  // 기존 일 단위 데이터 마이그레이션
  let dueMinutes = card.due
  let intervalMinutes = card.interval
  if (card.due < 10000) {
    // 일 단위로 저장된 경우 분 단위로 변환
    const { dayNumberToMinutes, daysToMinutes: daysToMin } = require('./reviewCard')
    dueMinutes = dayNumberToMinutes(card.due)
    intervalMinutes = card.interval < 365 ? daysToMin(card.interval) : card.interval
  }

  // Mastered: interval >= 21일 (30240분) 또는 reps >= 8
  const twentyOneDaysInMinutes = daysToMinutes(21)
  if (intervalMinutes >= twentyOneDaysInMinutes || card.reps >= 8) {
    return 'mastered'
  }

  // Review: due <= 현재 시각
  if (dueMinutes <= nowMinutes) {
    return 'review'
  }

  // Learning: reps가 적고 interval이 작을 때 (7일 = 10080분 미만)
  const sevenDaysInMinutes = daysToMinutes(7)
  if (card.reps < 3 && intervalMinutes < sevenDaysInMinutes) {
    return 'learning'
  }

  // 기본적으로 review로 처리
  return 'review'
}

