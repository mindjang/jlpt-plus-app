/**
 * UI 관련 상수 정의
 * 
 * 사용자 인터페이스에서 사용되는 고정값 모음
 */

// ==================== 학습 설정 ====================

/**
 * 자동 학습 모드 목표 학습량 옵션
 * 사용자가 선택할 수 있는 일일 학습 목표 개수
 */
export const AUTO_STUDY_TARGET_OPTIONS = [5, 10, 15, 20, 25, 30, 35, 40] as const

/**
 * 챕터 학습 모드 목표 학습량 옵션
 * 사용자가 선택할 수 있는 챕터별 학습 목표 개수
 */
export const CHAPTER_STUDY_TARGET_OPTIONS = [5, 10, 15, 20, 25, 30, 35, 40] as const

/**
 * 기본 목표 학습량
 * 초기 설정값
 */
export const DEFAULT_TARGET_AMOUNT = 20
