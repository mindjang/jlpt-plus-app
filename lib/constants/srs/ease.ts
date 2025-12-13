/**
 * SRS Ease Factor (난이도 계수) 관련 상수
 */

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

