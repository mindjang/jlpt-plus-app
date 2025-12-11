import type { UserCardState, ReviewParams } from '../types/srs'
import { normalizeCardState } from './cardMigration'
import {
  nowAsMinutes,
  daysToMinutes,
  minutesToDays,
  dayNumberToMinutes,
} from '../utils/dateUtils'
import {
  DEFAULT_EASE,
  MIN_EASE,
  MAX_EASE,
  EASE_AGAIN_PENALTY,
  EASE_HARD_PENALTY,
  EASE_GOOD_BONUS,
  EASE_EASY_BONUS,
  LEARNING_STEP_1_MINUTES,
  LEARNING_STEP_2_MINUTES,
  LEARNING_STEP_3_MINUTES,
  FIRST_REVIEW_EASY_DAYS,
  FIRST_REVIEW_NORMAL_DAYS,
  SECOND_REVIEW_EASY_DAYS,
  SECOND_REVIEW_NORMAL_DAYS,
  THIRD_REVIEW_EASY_DAYS,
  THIRD_REVIEW_NORMAL_DAYS,
  LAPSE_REDUCTION_FACTOR,
  LEECH_THRESHOLD,
  MAX_INTERVAL_MINUTES,
  ONE_DAY_IN_MINUTES,
  INTERVAL_THRESHOLDS,
} from './constants'

// 날짜 변환 함수들을 dateUtils에서 재export
export { nowAsMinutes, daysToMinutes, minutesToDays, dayNumberToMinutes }

/**
 * 카드 복습 처리 (언어 학습 최적화된 SRS)
 * - 학습 스텝(learning steps): 4시간 → 1일 → 3일 (단기→장기 기억 전환)
 * - 복습 단계: SM-2 (개선된 간격)
 * - Lapse(오답): 현재 간격의 25%로 감소 (최소 1일)
 */
export function reviewCard(
  prev: UserCardState | null,
  params: ReviewParams
): UserCardState {
  const nowMinutes = nowAsMinutes()

  let card: UserCardState

  if (!prev) {
    card = {
      itemId: params.itemId,
      type: params.type,
      level: params.level,
      reps: 0,
      lapses: 0,
      interval: 0,
      ease: DEFAULT_EASE,
      due: nowMinutes,
      lastReviewed: nowMinutes,
    }
  } else {
    // 마이그레이션이 필요한 경우 자동 변환
    const normalized = normalizeCardState(prev)
    card = normalized || prev
  }

  card.reps += 1
  card.lastReviewed = nowMinutes

  // 언어 학습에 최적화된 학습 스텝 (분 단위)
  // 4시간 → 1일 → 3일 (단기 기억 → 장기 기억 전환)
  const firstStep = LEARNING_STEP_1_MINUTES
  const secondStep = LEARNING_STEP_2_MINUTES
  const finalStep = LEARNING_STEP_3_MINUTES

  const capInterval = (minutes: number) => Math.min(minutes, MAX_INTERVAL_MINUTES)

  // 학습 단계 여부 판단: reps가 1 이하이거나 interval이 3일 미만이면 학습 스텝 적용
  const isLearningPhase = card.reps <= 1 || card.interval < finalStep

  if (params.grade === 'again') {
    card.lapses += 1
    if (isLearningPhase) {
      // 학습 스텝 초기화: 첫 스텝으로
      card.interval = firstStep
    } else {
      // 복습 단계에서 Lapse: 현재 간격 감소 (최소 1일)
      const reducedInterval = Math.floor(card.interval * LAPSE_REDUCTION_FACTOR)
      card.interval = Math.max(ONE_DAY_IN_MINUTES, reducedInterval)
      card.ease = Math.max(MIN_EASE, card.ease - EASE_AGAIN_PENALTY)
    }
    card.interval = capInterval(card.interval)
    card.due = nowMinutes + card.interval
    return card
  }

  // Ease Factor 조정
  if (params.grade === 'hard') {
    card.ease = Math.max(MIN_EASE, card.ease - EASE_HARD_PENALTY)
  } else if (params.grade === 'good') {
    // 'good' 평가 시 미세한 ease 증가 (학습 향상 반영)
    card.ease = Math.min(MAX_EASE, card.ease + EASE_GOOD_BONUS)
  } else if (params.grade === 'easy') {
    card.ease = Math.min(MAX_EASE, card.ease + EASE_EASY_BONUS)
  }

  // 학습 스텝 진행 (learning phase)
  if (isLearningPhase) {
    if (card.interval <= firstStep) {
      // 4시간 스텝 통과 후 1일로
      card.interval = secondStep
    } else if (card.interval <= secondStep) {
      // 1일 스텝 통과 후 3일로
      card.interval = finalStep
    } else {
      // 이미 3일 이상이면 SM-2로 진입
      const intervalInDaysFromLearning = card.interval / ONE_DAY_IN_MINUTES
      card.interval = daysToMinutes(params.grade === 'easy' ? Math.max(3, intervalInDaysFromLearning * card.ease) : intervalInDaysFromLearning)
    }
    card.interval = capInterval(card.interval)
  } else {
    // 복습 단계: SM-2 (개선된 간격)
    let intervalInDays: number
    intervalInDays = card.interval / ONE_DAY_IN_MINUTES

    if (intervalInDays === INTERVAL_THRESHOLDS.FIRST_REVIEW) {
      // 첫 복습: easy/good/hard 구분 (망각 곡선 고려)
      intervalInDays = params.grade === 'easy' ? FIRST_REVIEW_EASY_DAYS : FIRST_REVIEW_NORMAL_DAYS
    } else if (intervalInDays <= INTERVAL_THRESHOLDS.SECOND_REVIEW) {
      // 두 번째 복습
      intervalInDays = params.grade === 'easy' ? SECOND_REVIEW_EASY_DAYS : SECOND_REVIEW_NORMAL_DAYS
    } else if (intervalInDays <= INTERVAL_THRESHOLDS.THIRD_REVIEW) {
      // 세 번째 복습
      intervalInDays = params.grade === 'easy' ? THIRD_REVIEW_EASY_DAYS : THIRD_REVIEW_NORMAL_DAYS
    } else {
      // 네 번째 이후: SM-2 알고리즘 적용
      intervalInDays = Math.round(intervalInDays * card.ease)
    }

    card.interval = daysToMinutes(intervalInDays)
    card.interval = capInterval(card.interval)
  }

  card.due = nowMinutes + card.interval

  // Leech 처리: 반복 오답 카드 일시 정지
  if (card.lapses >= LEECH_THRESHOLD && !card.suspended) {
    card.suspended = true
  }

  return card
}

