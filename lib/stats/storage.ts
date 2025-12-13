/**
 * LocalStorage 관리 유틸리티
 */

import { UserStats, GameHistory, GameResult } from './types'

const STATS_KEY = 'jlpt_user_stats'
const HISTORY_KEY = 'jlpt_game_history'

// 기본 통계 구조
export function getDefaultStats(): UserStats {
  const now = Date.now()
  return {
    totalPlays: 0,
    totalTime: 0,
    totalScore: 0,
    gamesPlayed: 0,
    gameStats: {
      blast: {
        plays: 0,
        totalScore: 0,
        bestScore: 0,
        averageScore: 0,
        lastPlayed: 0,
        bestCombo: 0,
        averageCombo: 0,
      },
      flash: {
        plays: 0,
        totalScore: 0,
        bestScore: 0,
        averageScore: 0,
        lastPlayed: 0,
        bestStreak: 0,
        averageStreak: 0,
        totalQuestions: 0,
        correctAnswers: 0,
        accuracy: 0,
        perfectGames: 0,
      },
      match: {
        plays: 0,
        totalScore: 0,
        bestScore: 0,
        averageScore: 0,
        lastPlayed: 0,
        bestTime: Infinity,
        averageTime: 0,
        bestMoves: Infinity,
        averageMoves: 0,
        perfectGames: 0,
      },
    },
    levelStats: {
      N5: { plays: 0, bestScore: 0, averageScore: 0, totalScore: 0 },
      N4: { plays: 0, bestScore: 0, averageScore: 0, totalScore: 0 },
      N3: { plays: 0, bestScore: 0, averageScore: 0, totalScore: 0 },
      N2: { plays: 0, bestScore: 0, averageScore: 0, totalScore: 0 },
      N1: { plays: 0, bestScore: 0, averageScore: 0, totalScore: 0 },
    },
    today: { plays: 0, score: 0, time: 0 },
    thisWeek: { plays: 0, score: 0, time: 0 },
    thisMonth: { plays: 0, score: 0, time: 0 },
    firstPlayedAt: now,
    lastPlayedAt: now,
    lastUpdated: now,
  }
}

// 기본 히스토리 구조
export function getDefaultHistory(): GameHistory {
  return {
    results: [],
    maxSize: 100, // 최근 100개만 저장
  }
}

// 통계 불러오기
export function loadStats(): UserStats {
  if (typeof window === 'undefined') return getDefaultStats()
  
  try {
    const saved = localStorage.getItem(STATS_KEY)
    if (!saved) return getDefaultStats()
    
    const stats = JSON.parse(saved) as UserStats
    
    // 기간별 통계 초기화 확인
    resetPeriodStatsIfNeeded(stats)
    
    return stats
  } catch (error) {
    console.error('Failed to load stats:', error)
    return getDefaultStats()
  }
}

// 통계 저장하기
export function saveStats(stats: UserStats): void {
  if (typeof window === 'undefined') return
  
  try {
    stats.lastUpdated = Date.now()
    localStorage.setItem(STATS_KEY, JSON.stringify(stats))
  } catch (error) {
    console.error('Failed to save stats:', error)
  }
}

// 히스토리 불러오기
export function loadHistory(): GameHistory {
  if (typeof window === 'undefined') return getDefaultHistory()
  
  try {
    const saved = localStorage.getItem(HISTORY_KEY)
    if (!saved) return getDefaultHistory()
    
    return JSON.parse(saved) as GameHistory
  } catch (error) {
    console.error('Failed to load history:', error)
    return getDefaultHistory()
  }
}

// 히스토리 저장하기
export function saveHistory(history: GameHistory): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
  } catch (error) {
    console.error('Failed to save history:', error)
  }
}

// 게임 결과 추가
export function addGameResult(result: GameResult): void {
  const history = loadHistory()
  
  // 최근 결과를 앞에 추가
  history.results.unshift(result)
  
  // 최대 개수 초과 시 오래된 것 제거
  if (history.results.length > history.maxSize) {
    history.results = history.results.slice(0, history.maxSize)
  }
  
  saveHistory(history)
}

// 기간별 통계 초기화 확인
function resetPeriodStatsIfNeeded(stats: UserStats): void {
  const now = Date.now()
  const lastUpdated = stats.lastUpdated
  
  // 날짜가 바뀌었는지 확인
  const lastDate = new Date(lastUpdated)
  const currentDate = new Date(now)
  
  if (lastDate.toDateString() !== currentDate.toDateString()) {
    // 오늘 통계 초기화
    stats.today = { plays: 0, score: 0, time: 0 }
  }
  
  // 주가 바뀌었는지 확인 (월요일 기준)
  const lastWeek = getWeekNumber(lastDate)
  const currentWeek = getWeekNumber(currentDate)
  
  if (lastWeek !== currentWeek) {
    stats.thisWeek = { plays: 0, score: 0, time: 0 }
  }
  
  // 월이 바뀌었는지 확인
  if (lastDate.getMonth() !== currentDate.getMonth() || 
      lastDate.getFullYear() !== currentDate.getFullYear()) {
    stats.thisMonth = { plays: 0, score: 0, time: 0 }
  }
}

// 주차 계산 (월요일 기준)
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

// 통계 초기화
export function resetStats(): void {
  if (typeof window === 'undefined') return
  
  localStorage.removeItem(STATS_KEY)
  localStorage.removeItem(HISTORY_KEY)
}

// 통계 내보내기 (백업용)
export function exportStats(): string {
  const stats = loadStats()
  const history = loadHistory()
  
  return JSON.stringify({ stats, history }, null, 2)
}

// 통계 가져오기 (백업 복원용)
export function importStats(data: string): boolean {
  try {
    const parsed = JSON.parse(data)
    
    if (parsed.stats) {
      saveStats(parsed.stats)
    }
    
    if (parsed.history) {
      saveHistory(parsed.history)
    }
    
    return true
  } catch (error) {
    console.error('Failed to import stats:', error)
    return false
  }
}

