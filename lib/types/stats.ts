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

/**
 * 일별 활동 요약
 * 경로: /users/{uid}/dailyActivity/{YYYY-MM-DD}
 */
export interface DailyActivity {
  date: string // YYYY-MM-DD
  totalTime: number // 총 학습 시간 (밀리초)
  totalQuestions: number // 총 문제 수
  
  // 모드별 분류
  modeBreakdown: {
    exampleStudy: { questions: number; time: number }
    quiz: { questions: number; time: number }
    game: { questions: number; time: number }
  }
  
  // 콘텐츠별 분류
  contentBreakdown: {
    word: { questions: number; correct: number }
    kanji: { questions: number; correct: number }
  }
  
  // 퀴즈 타입별 분류 (quiz 모드일 때)
  quizTypeBreakdown?: {
    wordToMeaning: number
    meaningToWord: number
    sentenceFillIn: number
  }
  
  // 레벨별 분류
  levelBreakdown: Record<JlptLevel, number>
  
  // 세션 정보
  sessions: number // 세션 횟수
  firstSessionAt: number // 첫 세션 시작 시각
  lastSessionAt: number // 마지막 세션 종료 시각
  
  updatedAt: number
}

/**
 * 연속 학습 일수
 * 경로: /users/{uid}/streakData/current
 */
export interface StreakData {
  currentStreak: number // 현재 연속 일수
  longestStreak: number // 최장 연속 일수
  lastStudyDate: string // YYYY-MM-DD
  totalDays: number // 총 학습한 날짜 수
  streakHistory: Array<{ start: string; end: string; days: number }> // 연속 기록
  updatedAt: number
}

/**
 * 주간 요약
 */
export interface WeeklySummary {
  weekStart: string // YYYY-MM-DD (월요일)
  totalTime: number
  totalQuestions: number
  averageScore: number
  dailyBreakdown: Record<string, number> // 요일별 문제 수
}

/**
 * 월간 요약
 */
export interface MonthlySummary {
  month: string // YYYY-MM
  totalTime: number
  totalQuestions: number
  averageScore: number
  topLevel: JlptLevel // 가장 많이 학습한 레벨
}