/**
 * 게임 통계 타입 정의
 */

export type GameType = 'blast' | 'flash' | 'match'

// 개별 게임 결과
export interface GameResult {
  gameType: GameType
  level: string // N5, N4, N3, N2, N1
  mode: 'word' | 'kanji'
  score: number
  timestamp: number
  
  // BLAST용
  combo?: number
  lives?: number
  
  // FLASH용
  streak?: number
  questionCount?: number
  totalQuestions?: number
  accuracy?: number
  
  // MATCH용
  time?: number
  moves?: number
  difficulty?: 'easy' | 'medium' | 'hard'
}

// 게임별 통계
export interface GameStats {
  plays: number // 플레이 횟수
  totalScore: number // 총 점수
  bestScore: number // 최고 점수
  averageScore: number // 평균 점수
  lastPlayed: number // 마지막 플레이 시간
  
  // BLAST용
  bestCombo?: number
  averageCombo?: number
  
  // FLASH용
  bestStreak?: number
  averageStreak?: number
  totalQuestions?: number
  correctAnswers?: number
  accuracy?: number
  perfectGames?: number // 완벽 클리어 횟수 (FLASH & MATCH 공통)
  
  // MATCH용
  bestTime?: number
  averageTime?: number
  bestMoves?: number
  averageMoves?: number
}

// 레벨별 통계
export interface LevelStats {
  plays: number
  bestScore: number
  averageScore: number
  totalScore: number
}

// 전체 통계
export interface UserStats {
  // 전체 요약
  totalPlays: number
  totalTime: number // 초 단위
  totalScore: number
  gamesPlayed: number // 게임한 일수
  
  // 게임별 통계
  gameStats: {
    blast: GameStats
    flash: GameStats
    match: GameStats
  }
  
  // 레벨별 통계
  levelStats: {
    N5: LevelStats
    N4: LevelStats
    N3: LevelStats
    N2: LevelStats
    N1: LevelStats
  }
  
  // 기간별 통계
  today: {
    plays: number
    score: number
    time: number
  }
  thisWeek: {
    plays: number
    score: number
    time: number
  }
  thisMonth: {
    plays: number
    score: number
    time: number
  }
  
  // 메타 정보
  firstPlayedAt: number
  lastPlayedAt: number
  lastUpdated: number
}

// 게임 히스토리 (최근 N개만 저장)
export interface GameHistory {
  results: GameResult[]
  maxSize: number // 최대 저장 개수 (예: 100개)
}

