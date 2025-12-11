/**
 * SRS (Spaced Repetition System) 상수 정의
 * 
 * 일본어 학습에 최적화된 간격 반복 알고리즘 설정
 * SM-2 알고리즘 기반, 언어 학습 특성 반영
 */

// ==================== Ease Factor (난이도 계수) ====================

/**
 * 기본 Ease Factor
 * 새 카드의 초기 난이도 계수 (2.5 = 다음 복습 시 간격이 2.5배로 증가)
 */
export const DEFAULT_EASE = 2.5

/**
 * 최소 Ease Factor
 * 난이도가 너무 낮아지는 것을 방지 (최소 1.3배)
 */
export const MIN_EASE = 1.3

/**
 * 최대 Ease Factor
 * 난이도가 너무 높아지는 것을 방지 (최대 3.0배)
 */
export const MAX_EASE = 3.0

// ==================== Ease Factor 조정값 ====================

/**
 * "다시" 평가 시 Ease 감소량
 * 완전히 못 외웠을 때 난이도를 많이 낮춤
 */
export const EASE_AGAIN_PENALTY = 0.2

/**
 * "어려움" 평가 시 Ease 감소량
 * 겨우 맞췄을 때 난이도를 조금 낮춤
 */
export const EASE_HARD_PENALTY = 0.15

/**
 * "보통" 평가 시 Ease 증가량
 * 정상적으로 외웠을 때 난이도를 미세하게 높임
 */
export const EASE_GOOD_BONUS = 0.05

/**
 * "쉬움" 평가 시 Ease 증가량
 * 쉽게 외웠을 때 난이도를 높임
 */
export const EASE_EASY_BONUS = 0.15

// ==================== 학습 단계 (Learning Steps) ====================

/**
 * 첫 번째 학습 단계: 4시간
 * 단기 기억 강화 단계 (분 단위)
 */
export const LEARNING_STEP_1_MINUTES = 4 * 60

/**
 * 두 번째 학습 단계: 1일
 * 장기 기억 전환 단계 (분 단위)
 */
export const LEARNING_STEP_2_MINUTES = 24 * 60

/**
 * 세 번째 학습 단계: 3일
 * 장기 기억 강화 단계 (분 단위)
 */
export const LEARNING_STEP_3_MINUTES = 3 * 24 * 60

/**
 * 학습 단계 배열
 * 4시간 → 1일 → 3일 (단기 기억 → 장기 기억)
 */
export const LEARNING_STEPS = [
  LEARNING_STEP_1_MINUTES,
  LEARNING_STEP_2_MINUTES,
  LEARNING_STEP_3_MINUTES,
] as const

// ==================== 복습 간격 (Review Intervals) ====================

/**
 * 첫 복습 - "쉬움" 평가 시 간격 (일)
 */
export const FIRST_REVIEW_EASY_DAYS = 3

/**
 * 첫 복습 - "보통"/"어려움" 평가 시 간격 (일)
 */
export const FIRST_REVIEW_NORMAL_DAYS = 2

/**
 * 두 번째 복습 - "쉬움" 평가 시 간격 (일)
 */
export const SECOND_REVIEW_EASY_DAYS = 5

/**
 * 두 번째 복습 - "보통"/"어려움" 평가 시 간격 (일)
 */
export const SECOND_REVIEW_NORMAL_DAYS = 3

/**
 * 세 번째 복습 - "쉬움" 평가 시 간격 (일)
 */
export const THIRD_REVIEW_EASY_DAYS = 7

/**
 * 세 번째 복습 - "보통"/"어려움" 평가 시 간격 (일)
 */
export const THIRD_REVIEW_NORMAL_DAYS = 5

// ==================== Lapse (오답) 처리 ====================

/**
 * Lapse 시 간격 감소 비율
 * 오답 시 현재 간격의 25%로 줄어듦
 */
export const LAPSE_REDUCTION_FACTOR = 0.25

/**
 * Lapse 후 최소 간격 (일)
 * 오답 후에도 최소 1일은 보장
 */
export const MIN_LAPSE_INTERVAL_DAYS = 1

// ==================== Leech (문제 카드) 처리 ====================

/**
 * Leech 판정 기준
 * 8번 이상 틀리면 leech로 판정하여 일시 정지
 * 일본어 학습 특성상 반복 오답 카드는 별도 학습 필요
 */
export const LEECH_THRESHOLD = 8

// ==================== 간격 제한 ====================

/**
 * 최대 복습 간격 (일)
 * 1년을 초과하지 않도록 제한
 */
export const MAX_INTERVAL_DAYS = 365

/**
 * 최대 복습 간격 (분)
 */
export const MAX_INTERVAL_MINUTES = MAX_INTERVAL_DAYS * 24 * 60

// ==================== 장기 기억 판정 ====================

/**
 * 장기 기억 판정 - 최소 간격 (일)
 * 21일 이상 간격이면 장기 기억으로 간주
 */
export const LONG_TERM_MEMORY_INTERVAL_DAYS = 21

/**
 * 장기 기억 판정 - 최소 복습 횟수
 * 8회 이상 복습했으면 장기 기억으로 간주
 */
export const LONG_TERM_MEMORY_REPS = 8

// ==================== 유틸리티 상수 ====================

/**
 * 1일을 분으로 환산
 */
export const ONE_DAY_IN_MINUTES = 24 * 60

/**
 * 복습 간격 비교 기준값들 (일 단위)
 * 학습 단계와 복습 단계를 구분하는 기준
 */
export const INTERVAL_THRESHOLDS = {
  /** 0일: 첫 복습 구간 */
  FIRST_REVIEW: 0,
  /** 2일: 두 번째 복습 구간 */
  SECOND_REVIEW: 2,
  /** 3일: 세 번째 복습 구간 */
  THIRD_REVIEW: 3,
} as const

// ==================== 학습 큐 설정 ====================

/**
 * 기본 일일 새 카드 제한
 * 사용자가 설정하지 않을 때 기본값
 */
export const DEFAULT_DAILY_NEW_CARDS = 10

/**
 * 복습 카드 최대 조회 수
 * 한 번에 가져올 복습 카드의 최대 개수
 */
export const MAX_REVIEW_CARDS_FETCH = 100

/**
 * 복습 카드 비율
 * 학습 큐에서 복습 카드가 차지하는 비율 (70%)
 */
export const REVIEW_CARD_RATIO = 0.7

/**
 * 새 카드 비율
 * 학습 큐에서 새 카드가 차지하는 비율 (30%)
 */
export const NEW_CARD_RATIO = 0.3
