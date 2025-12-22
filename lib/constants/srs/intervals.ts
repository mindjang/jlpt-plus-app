/**
 * SRS 간격 관련 상수
 */

import { ONE_DAY_IN_MINUTES } from '../time'

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
export const LEARNING_STEP_2_MINUTES = ONE_DAY_IN_MINUTES

/**
 * 세 번째 학습 단계: 3일
 * 장기 기억 강화 단계 (분 단위)
 */
export const LEARNING_STEP_3_MINUTES = 3 * ONE_DAY_IN_MINUTES

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
export const MAX_INTERVAL_MINUTES = MAX_INTERVAL_DAYS * ONE_DAY_IN_MINUTES

// ==================== 장기 기억 판정 ====================

/**
 * 장기 기억 판정 - 최소 간격 (일)
 * 30일 이상 간격이면 장기 기억으로 간주
 */
export const LONG_TERM_MEMORY_INTERVAL_DAYS = 30

/**
 * 장기 기억 판정 - 최소 복습 횟수
 * 12회 이상 복습했으면 장기 기억으로 간주
 */
export const LONG_TERM_MEMORY_REPS = 12

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

