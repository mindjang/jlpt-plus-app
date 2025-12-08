// 카드 상태 판정 로직
import type { UserCardState, CardStatus } from '../types/srs'
import { todayAsDayNumber } from './reviewCard'

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

  const today = todayAsDayNumber()

  // Mastered: interval >= 21일 또는 reps >= 8
  if (card.interval >= 21 || card.reps >= 8) {
    return 'mastered'
  }

  // Review: due <= 오늘
  if (card.due <= today) {
    return 'review'
  }

  // Learning: reps가 적고 interval이 작을 때
  if (card.reps < 3 && card.interval < 7) {
    return 'learning'
  }

  // 기본적으로 review로 처리
  return 'review'
}

