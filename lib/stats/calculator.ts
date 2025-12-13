/**
 * 통계 계산 및 업데이트 로직
 */

import { UserStats, GameResult, GameStats, LevelStats } from './types'
import { loadStats, saveStats, addGameResult } from './storage'

// 게임 결과 기록 및 통계 업데이트
export function recordGameResult(result: GameResult): UserStats {
  const stats = loadStats()
  const now = Date.now()
  
  // 게임 결과를 히스토리에 추가
  addGameResult(result)
  
  // 전체 통계 업데이트
  stats.totalPlays += 1
  stats.totalScore += result.score
  stats.lastPlayedAt = now
  
  // 게임별 통계 업데이트
  updateGameStats(stats, result)
  
  // 레벨별 통계 업데이트
  updateLevelStats(stats, result)
  
  // 기간별 통계 업데이트
  updatePeriodStats(stats, result)
  
  // 저장
  saveStats(stats)
  
  return stats
}

// 게임별 통계 업데이트
function updateGameStats(stats: UserStats, result: GameResult): void {
  const gameStats = stats.gameStats[result.gameType]
  
  // 기본 통계
  gameStats.plays += 1
  gameStats.totalScore += result.score
  gameStats.bestScore = Math.max(gameStats.bestScore, result.score)
  gameStats.averageScore = gameStats.totalScore / gameStats.plays
  gameStats.lastPlayed = result.timestamp
  
  // 게임별 특수 통계
  switch (result.gameType) {
    case 'blast':
      updateBlastStats(gameStats, result)
      break
    case 'flash':
      updateFlashStats(gameStats, result)
      break
    case 'match':
      updateMatchStats(gameStats, result)
      break
  }
}

// BLAST 통계 업데이트
function updateBlastStats(gameStats: GameStats, result: GameResult): void {
  if (result.combo !== undefined) {
    gameStats.bestCombo = Math.max(gameStats.bestCombo || 0, result.combo)
    
    // 평균 콤보 계산
    const prevTotal = (gameStats.averageCombo || 0) * (gameStats.plays - 1)
    gameStats.averageCombo = (prevTotal + result.combo) / gameStats.plays
  }
}

// FLASH 통계 업데이트
function updateFlashStats(gameStats: GameStats, result: GameResult): void {
  if (result.streak !== undefined) {
    gameStats.bestStreak = Math.max(gameStats.bestStreak || 0, result.streak)
    
    // 평균 연속 정답 계산
    const prevTotal = (gameStats.averageStreak || 0) * (gameStats.plays - 1)
    gameStats.averageStreak = (prevTotal + result.streak) / gameStats.plays
  }
  
  if (result.questionCount !== undefined && result.totalQuestions !== undefined) {
    gameStats.totalQuestions = (gameStats.totalQuestions || 0) + result.totalQuestions
    gameStats.correctAnswers = (gameStats.correctAnswers || 0) + result.questionCount
    gameStats.accuracy = gameStats.correctAnswers / gameStats.totalQuestions
    
    // 완벽 클리어 체크 (20문제 모두 맞춤)
    if (result.questionCount === result.totalQuestions && result.totalQuestions === 20) {
      gameStats.perfectGames = (gameStats.perfectGames || 0) + 1
    }
  }
}

// MATCH 통계 업데이트
function updateMatchStats(gameStats: GameStats, result: GameResult): void {
  if (result.time !== undefined) {
    gameStats.bestTime = Math.min(gameStats.bestTime || Infinity, result.time)
    
    // 평균 시간 계산
    const prevTotal = (gameStats.averageTime || 0) * (gameStats.plays - 1)
    gameStats.averageTime = (prevTotal + result.time) / gameStats.plays
  }
  
  if (result.moves !== undefined) {
    gameStats.bestMoves = Math.min(gameStats.bestMoves || Infinity, result.moves)
    
    // 평균 이동 횟수 계산
    const prevTotal = (gameStats.averageMoves || 0) * (gameStats.plays - 1)
    gameStats.averageMoves = (prevTotal + result.moves) / gameStats.plays
  }
  
  // 완벽 클리어 체크 (최소 이동으로 완료)
  const difficulty = result.difficulty || 'easy'
  const minMoves = difficulty === 'easy' ? 8 : difficulty === 'medium' ? 12 : 16
  if (result.moves === minMoves) {
    gameStats.perfectGames = (gameStats.perfectGames || 0) + 1
  }
}

// 레벨별 통계 업데이트
function updateLevelStats(stats: UserStats, result: GameResult): void {
  const level = result.level as keyof typeof stats.levelStats
  if (!stats.levelStats[level]) return
  
  const levelStats = stats.levelStats[level]
  
  levelStats.plays += 1
  levelStats.totalScore += result.score
  levelStats.bestScore = Math.max(levelStats.bestScore, result.score)
  levelStats.averageScore = levelStats.totalScore / levelStats.plays
}

// 기간별 통계 업데이트
function updatePeriodStats(stats: UserStats, result: GameResult): void {
  // 오늘
  stats.today.plays += 1
  stats.today.score += result.score
  
  // 이번 주
  stats.thisWeek.plays += 1
  stats.thisWeek.score += result.score
  
  // 이번 달
  stats.thisMonth.plays += 1
  stats.thisMonth.score += result.score
}

// 새로운 최고 기록 체크
export interface RecordBreak {
  type: 'score' | 'combo' | 'streak' | 'time' | 'moves'
  gameType: string
  oldValue: number
  newValue: number
  improvement: number
}

export function checkRecordBreak(result: GameResult): RecordBreak[] {
  const stats = loadStats()
  const gameStats = stats.gameStats[result.gameType]
  const records: RecordBreak[] = []
  
  // 최고 점수
  if (result.score > gameStats.bestScore) {
    records.push({
      type: 'score',
      gameType: result.gameType,
      oldValue: gameStats.bestScore,
      newValue: result.score,
      improvement: result.score - gameStats.bestScore,
    })
  }
  
  // 게임별 기록
  switch (result.gameType) {
    case 'blast':
      if (result.combo && result.combo > (gameStats.bestCombo || 0)) {
        records.push({
          type: 'combo',
          gameType: result.gameType,
          oldValue: gameStats.bestCombo || 0,
          newValue: result.combo,
          improvement: result.combo - (gameStats.bestCombo || 0),
        })
      }
      break
      
    case 'flash':
      if (result.streak && result.streak > (gameStats.bestStreak || 0)) {
        records.push({
          type: 'streak',
          gameType: result.gameType,
          oldValue: gameStats.bestStreak || 0,
          newValue: result.streak,
          improvement: result.streak - (gameStats.bestStreak || 0),
        })
      }
      break
      
    case 'match':
      if (result.time && result.time < (gameStats.bestTime || Infinity)) {
        records.push({
          type: 'time',
          gameType: result.gameType,
          oldValue: gameStats.bestTime || 0,
          newValue: result.time,
          improvement: (gameStats.bestTime || 0) - result.time,
        })
      }
      if (result.moves && result.moves < (gameStats.bestMoves || Infinity)) {
        records.push({
          type: 'moves',
          gameType: result.gameType,
          oldValue: gameStats.bestMoves || 0,
          newValue: result.moves,
          improvement: (gameStats.bestMoves || 0) - result.moves,
        })
      }
      break
  }
  
  return records
}

// 통계 요약 계산
export interface StatsSummary {
  totalGames: number
  totalScore: number
  averageScore: number
  favoriteGame: string
  bestLevel: string
  playStreak: number // 연속 플레이 일수
  totalPlayTime: string // 포맷된 시간
}

export function calculateSummary(stats: UserStats): StatsSummary {
  // 가장 많이 한 게임
  const gamePlayCounts = [
    { game: 'WORD BLAST', count: stats.gameStats.blast.plays },
    { game: 'FLASH QUIZ', count: stats.gameStats.flash.plays },
    { game: 'WORD MATCH', count: stats.gameStats.match.plays },
  ]
  const favoriteGame = gamePlayCounts.sort((a, b) => b.count - a.count)[0]?.game || '-'
  
  // 가장 잘하는 레벨
  const levelScores = Object.entries(stats.levelStats)
    .map(([level, stat]) => ({ level, score: stat.bestScore }))
    .sort((a, b) => b.score - a.score)
  const bestLevel = levelScores[0]?.level || '-'
  
  // 평균 점수
  const averageScore = stats.totalPlays > 0 ? Math.round(stats.totalScore / stats.totalPlays) : 0
  
  // 플레이 시간 포맷
  const hours = Math.floor(stats.totalTime / 3600)
  const minutes = Math.floor((stats.totalTime % 3600) / 60)
  const totalPlayTime = hours > 0 ? `${hours}시간 ${minutes}분` : `${minutes}분`
  
  return {
    totalGames: stats.totalPlays,
    totalScore: stats.totalScore,
    averageScore,
    favoriteGame,
    bestLevel,
    playStreak: 0, // TODO: 연속 플레이 일수 계산
    totalPlayTime,
  }
}

