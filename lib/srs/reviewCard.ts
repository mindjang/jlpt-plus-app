import type { UserCardState, ReviewParams } from '../types/srs'

const DEFAULT_EASE = 2.5
const MIN_EASE = 1.3
const ONE_DAY_IN_MINUTES = 24 * 60
const MAX_INTERVAL_DAYS = 365
const MAX_INTERVAL_MINUTES = MAX_INTERVAL_DAYS * ONE_DAY_IN_MINUTES

export function nowAsMinutes(): number {
  return Math.floor(Date.now() / (1000 * 60))
}

export function daysToMinutes(days: number): number {
  return days * ONE_DAY_IN_MINUTES
}

export function minutesToDays(minutes: number): number {
  return Math.round(minutes / ONE_DAY_IN_MINUTES * 10) / 10
}

export function dayNumberToMinutes(dayNumber: number): number {
  const epochStartMinutes = Math.floor(new Date('1970-01-01').getTime() / (1000 * 60))
  return epochStartMinutes + (dayNumber * ONE_DAY_IN_MINUTES)
}

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
    card = { ...prev }
    if (card.due < 10000) {
      card.due = dayNumberToMinutes(card.due)
      card.lastReviewed = dayNumberToMinutes(card.lastReviewed)
      if (card.interval < 365) {
        card.interval = daysToMinutes(card.interval)
      }
    }
  }

  card.reps += 1
  card.lastReviewed = nowMinutes

  // 언어 학습에 최적화된 학습 스텝 (분 단위)
  // 4시간 → 1일 → 3일 (단기 기억 → 장기 기억 전환)
  const LEARNING_STEPS = [
    4 * 60,           // 4시간 (단기 기억 강화)
    ONE_DAY_IN_MINUTES,  // 1일 (장기 기억 전환)
    3 * ONE_DAY_IN_MINUTES  // 3일 (강화)
  ]
  const firstStep = LEARNING_STEPS[0]
  const secondStep = LEARNING_STEPS[1]
  const finalStep = LEARNING_STEPS[2]

  const capInterval = (minutes: number) => Math.min(minutes, MAX_INTERVAL_MINUTES)

  // 학습 단계 여부 판단: reps가 1 이하이거나 interval이 3일 미만이면 학습 스텝 적용
  const isLearningPhase = card.reps <= 1 || card.interval < finalStep

  if (params.grade === 'again') {
    card.lapses += 1
    if (isLearningPhase) {
      // 학습 스텝 초기화: 첫 스텝으로
      card.interval = firstStep
    } else {
      // 복습 단계에서 Lapse: 현재 간격의 25%로 감소 (최소 1일)
      const reducedInterval = Math.floor(card.interval * 0.25)
      card.interval = Math.max(ONE_DAY_IN_MINUTES, reducedInterval)
      card.ease = Math.max(MIN_EASE, card.ease - 0.2)
    }
    card.interval = capInterval(card.interval)
    card.due = nowMinutes + card.interval
    return card
  }

  // Ease Factor 조정
  if (params.grade === 'hard') {
    card.ease = Math.max(MIN_EASE, card.ease - 0.15)
  } else if (params.grade === 'good') {
    // 'good' 평가 시 미세한 ease 증가 (학습 향상 반영)
    card.ease = Math.min(3.0, card.ease + 0.05)
  } else if (params.grade === 'easy') {
    card.ease = Math.min(3.0, card.ease + 0.15)
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

    if (intervalInDays === 0) {
      // 첫 복습: easy는 3일, good/hard는 2일 (망각 곡선 고려)
      intervalInDays = params.grade === 'easy' ? 3 : 2
    } else if (intervalInDays <= 2) {
      // 두 번째 복습: easy는 5일, good/hard는 3일
      intervalInDays = params.grade === 'easy' ? 5 : 3
    } else if (intervalInDays <= 3) {
      // 세 번째 복습: easy는 7일, good/hard는 5일
      intervalInDays = params.grade === 'easy' ? 7 : 5
    } else {
      // 네 번째 이후: SM-2 알고리즘 적용
      intervalInDays = Math.round(intervalInDays * card.ease)
    }

    card.interval = daysToMinutes(intervalInDays)
    card.interval = capInterval(card.interval)
  }

  card.due = nowMinutes + card.interval

  // Leech 처리: lapses >= 8 (일본어 학습에 맞춘 기준)
  if (card.lapses >= 8 && !card.suspended) {
    card.suspended = true
  }

  return card
}

