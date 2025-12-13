/**
 * 학습 관련 타입 정의
 */

import type { UserCardState } from './srs'

/**
 * 카드 평가 결과
 */
export interface EvaluationResult {
  updatedState: UserCardState
  nextReviewInterval: number
}

/**
 * 학습 세션 통계
 */
export interface StudySessionStats {
  totalCards: number
  newCards: number
  reviewCards: number
  studyTime: number
}

