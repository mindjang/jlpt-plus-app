/**
 * 퀴즈 경험치 시스템
 */
import type { UserQuizLevel } from '@/lib/types/quiz'

/**
 * 경험치 계산
 */
export function calculateExp(
  isCorrect: boolean,
  streakCount: number,
  timeSpent: number
): number {
  const baseExp = 10

  if (!isCorrect) {
    return baseExp // 오답도 참여 경험치는 줌
  }

  const correctBonus = 10
  const streakBonus = streakCount * 2
  
  // 시간 보너스 (3초 이내: +5, 5초 이내: +3, 10초 이내: +1)
  let timeBonus = 0
  if (timeSpent < 3000) {
    timeBonus = 5
  } else if (timeSpent < 5000) {
    timeBonus = 3
  } else if (timeSpent < 10000) {
    timeBonus = 1
  }

  return baseExp + correctBonus + streakBonus + timeBonus
}

/**
 * 다음 레벨까지 필요한 경험치 계산
 */
export function getExpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.5))
}

/**
 * 경험치 추가 및 레벨업 확인
 */
export function addExp(
  currentLevel: UserQuizLevel,
  expGained: number
): {
  newLevel: UserQuizLevel
  leveledUp: boolean
  levelsGained: number
} {
  let { level, exp, totalExp, expForNextLevel } = currentLevel
  
  exp += expGained
  totalExp += expGained
  
  let leveledUp = false
  let levelsGained = 0

  // 레벨업 체크 (여러 레벨을 한 번에 올릴 수도 있음)
  while (exp >= expForNextLevel) {
    exp -= expForNextLevel
    level += 1
    levelsGained += 1
    leveledUp = true
    expForNextLevel = getExpForLevel(level)
  }

  const newLevel: UserQuizLevel = {
    ...currentLevel,
    level,
    exp,
    totalExp,
    expForNextLevel,
    lastLevelUp: leveledUp ? Date.now() : currentLevel.lastLevelUp,
    updatedAt: Date.now(),
  }

  return {
    newLevel,
    leveledUp,
    levelsGained,
  }
}

/**
 * 레벨별 칭호 가져오기
 */
export function getLevelTitle(level: number): string {
  if (level < 5) return '초보자'
  if (level < 10) return '학습자'
  if (level < 20) return '숙련자'
  if (level < 30) return '전문가'
  if (level < 50) return '달인'
  if (level < 75) return '마스터'
  if (level < 100) return '그랜드마스터'
  return '전설'
}

/**
 * 현재 레벨 진행도 (0-1)
 */
export function getLevelProgress(currentLevel: UserQuizLevel): number {
  return currentLevel.exp / currentLevel.expForNextLevel
}

/**
 * 세션 총 경험치 계산
 */
export function calculateSessionExp(
  correctCount: number,
  totalQuestions: number,
  maxStreak: number,
  averageTimePerQuestion: number
): number {
  let totalExp = 0

  // 각 정답에 대한 기본 경험치
  totalExp += correctCount * 20 // 정답 시 기본 10 + 보너스 10

  // 오답/참여 경험치
  const wrongCount = totalQuestions - correctCount
  totalExp += wrongCount * 10

  // 최대 연속 정답 보너스
  if (maxStreak >= 5) {
    totalExp += maxStreak * 5
  }

  // 평균 응답 시간 보너스
  if (averageTimePerQuestion < 5000) {
    totalExp += Math.floor((5000 - averageTimePerQuestion) / 100)
  }

  return totalExp
}

