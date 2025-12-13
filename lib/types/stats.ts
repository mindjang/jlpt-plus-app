/**
 * 레벨별 통계 타입 정의
 */
import type { CardType } from './srs'
import type { JlptLevel } from './content'

/**
 * 레벨별 학습 통계 (집계 데이터)
 * 경로: /users/{uid}/stats/{level}
 */
export interface LevelStats {
  level: JlptLevel
  
  // 단어 통계
  wordStats: {
    total: number           // 학습한 총 단어 수
    new: number            // 새 카드 (학습 시작 안 함)
    learning: number       // 학습 중 (interval < 21일)
    review: number         // 복습 대기 (due <= today)
    longTermMemory: number // 장기 기억 (interval >= 21일)
  }
  
  // 한자 통계
  kanjiStats: {
    total: number
    new: number
    learning: number
    review: number
    longTermMemory: number
  }
  
  // 최종 업데이트 시각
  lastUpdated: number // epoch ms
}

/**
 * 진행률 통계 (progressCalculation.ts에서 이동)
 */
export interface ProgressStats {
  longTermMemory: number
  todayNewStudied: number
  learned: number
}

/**
 * 회차 진행률 (progressCalculation.ts에서 이동)
 */
export interface RoundProgress {
  currentRound: number
  currentRoundProgress: number
  completedRounds: number
}