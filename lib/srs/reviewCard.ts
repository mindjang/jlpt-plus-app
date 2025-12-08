// Anki/SM-2 스타일 SRS 로직
import type { UserCardState, ReviewParams } from '../types/srs'

const DEFAULT_EASE = 2.5
const MIN_EASE = 1.3

/**
 * 오늘을 일 단위 정수로 변환 (YYYY-MM-DD 기준)
 */
export function todayAsDayNumber(): number {
  return Math.floor(Date.now() / (1000 * 60 * 60 * 24))
}

/**
 * 카드 복습 처리 (Anki/SM-2 알고리즘)
 */
export function reviewCard(
  prev: UserCardState | null,
  params: ReviewParams
): UserCardState {
  const nowDay = todayAsDayNumber()

  let card: UserCardState

  if (!prev) {
    // 새 카드 최초 학습
    card = {
      itemId: params.itemId,
      type: params.type,
      level: params.level,
      reps: 0,
      lapses: 0,
      interval: 0,
      ease: DEFAULT_EASE,
      due: nowDay,
      lastReviewed: nowDay,
    }
  } else {
    card = { ...prev }
  }

  card.reps += 1
  card.lastReviewed = nowDay

  if (params.grade === 'again') {
    card.lapses += 1
    card.interval = 1 // 다음날 다시
    card.due = nowDay + 1
    card.ease = Math.max(MIN_EASE, card.ease - 0.2)
    return card
  }

  // ease 조정
  if (params.grade === 'hard') {
    card.ease = Math.max(MIN_EASE, card.ease - 0.15)
  } else if (params.grade === 'easy') {
    card.ease = card.ease + 0.15
  }

  // interval 계산
  if (card.interval === 0) {
    // 첫 복습
    card.interval = params.grade === 'easy' ? 2 : 1
  } else if (card.interval === 1) {
    // 두 번째 복습
    card.interval = params.grade === 'easy' ? 4 : 3
  } else {
    // 그 이후 Anki SM-2 기본식
    card.interval = Math.round(card.interval * card.ease)
  }

  card.due = nowDay + card.interval

  // Leech 처리: lapses >= 5이면 suspended
  if (card.lapses >= 5 && !card.suspended) {
    card.suspended = true
  }

  return card
}

