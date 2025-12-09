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
 * 카드 복습 처리 (Anki 학습 스텝 + SM-2)
 * - 학습 스텝(learning steps): 1분 → 10분 → 1일
 * - 복습 단계: SM-2
 * - Lapse(오답): 10분 → 1일로 재진입
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

  // 학습 스텝 정의 (분)
  const LEARNING_STEPS = [1, 10, 1440] // 1분, 10분, 1일
  const firstStep = LEARNING_STEPS[0]
  const secondStep = LEARNING_STEPS[1]
  const finalStep = LEARNING_STEPS[2]

  const capInterval = (minutes: number) => Math.min(minutes, MAX_INTERVAL_MINUTES)

  // 학습 단계 여부 판단: reps가 1 이하이거나 interval이 1일 미만이면 학습 스텝 적용
  const isLearningPhase = card.reps <= 1 || card.interval < ONE_DAY_IN_MINUTES

  if (params.grade === 'again') {
    card.lapses += 1
    if (isLearningPhase) {
      // 학습 스텝 초기화: 1분
      card.interval = firstStep
    } else {
      // Lapse: 10분으로 재진입
      card.interval = secondStep
      card.ease = Math.max(MIN_EASE, card.ease - 0.2)
    }
    card.interval = capInterval(card.interval)
    card.due = nowMinutes + card.interval
    return card
  }

  if (params.grade === 'hard') {
    card.ease = Math.max(MIN_EASE, card.ease - 0.15)
  } else if (params.grade === 'easy') {
    card.ease = card.ease + 0.15
  }

  // 학습 스텝 진행 (learning phase)
  if (isLearningPhase) {
    if (card.interval <= firstStep) {
      // 1분 스텝 통과 후 10분으로
      card.interval = secondStep
    } else if (card.interval <= secondStep) {
      // 10분 스텝 통과 후 1일로
      card.interval = finalStep
    } else {
      // 이미 1일 이상이면 SM-2로 진입
      const intervalInDaysFromLearning = card.interval / ONE_DAY_IN_MINUTES
      card.interval = daysToMinutes(params.grade === 'easy' ? Math.max(1, intervalInDaysFromLearning * card.ease) : intervalInDaysFromLearning)
    }
    card.interval = capInterval(card.interval)
  } else {
    // 복습 단계: SM-2
    let intervalInDays: number
    intervalInDays = card.interval / ONE_DAY_IN_MINUTES

    if (intervalInDays === 0) {
      intervalInDays = params.grade === 'easy' ? 2 : 1
    } else if (intervalInDays === 1) {
      intervalInDays = params.grade === 'easy' ? 4 : 3
    } else {
      intervalInDays = Math.round(intervalInDays * card.ease)
    }

    card.interval = daysToMinutes(intervalInDays)
    card.interval = capInterval(card.interval)
  }

  card.due = nowMinutes + card.interval

  if (card.lapses >= 5 && !card.suspended) {
    card.suspended = true
  }

  return card
}

