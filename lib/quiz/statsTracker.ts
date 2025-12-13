/**
 * 퀴즈 통계 추적 및 약점 분석
 */
import type { QuizAnswer, ItemStats, WeakItem } from '@/lib/types/quiz'
import type { JlptLevel } from '@/lib/types/content'
import type { NaverWord, KanjiAliveEntry } from '@/data/types'
import { getNaverWordsByLevel } from '@/data/words/index'
import { getKanjiByLevel } from '@/data/kanji/index'
import { getKanjiCharacter } from '@/lib/data/kanji/kanjiHelpers'

/**
 * 약점 아이템 추출
 */
export function extractWeakItems(
  itemStatsMap: Record<string, ItemStats>,
  minAttempts: number = 2,
  accuracyThreshold: number = 0.6
): ItemStats[] {
  const items = Object.values(itemStatsMap)

  // 충분한 시도 횟수가 있고, 정답률이 낮은 아이템만 필터링
  const weakItems = items.filter(
    (item) => item.attempts >= minAttempts && item.accuracy < accuracyThreshold
  )

  // 정답률 낮은 순으로 정렬
  weakItems.sort((a, b) => a.accuracy - b.accuracy)

  return weakItems
}

/**
 * 약점 아이템을 실제 데이터와 결합
 */
export async function getWeakItemsWithData(
  weakStats: ItemStats[],
  level: JlptLevel
): Promise<WeakItem[]> {
  const words = getNaverWordsByLevel(level)
  const kanjis = getKanjiByLevel(level)

  const weakItems: WeakItem[] = []

  for (const stat of weakStats) {
    const [type, id] = stat.itemId.split(':')

    if (type === 'word') {
      const word = words.find((w) => w.entry === id)
      if (word) {
        weakItems.push({
          itemId: stat.itemId,
          itemType: 'word',
          level: stat.level,
          accuracy: stat.accuracy,
          attempts: stat.attempts,
          data: word,
        })
      }
    } else if (type === 'kanji') {
      const kanji = kanjis.find((k) => getKanjiCharacter(k) === id)
      if (kanji) {
        weakItems.push({
          itemId: stat.itemId,
          itemType: 'kanji',
          level: stat.level,
          accuracy: stat.accuracy,
          attempts: stat.attempts,
          data: kanji,
        })
      }
    }
  }

  return weakItems
}

/**
 * 세션 결과로부터 아이템별 결과 추출
 */
export function extractItemResults(
  answers: QuizAnswer[],
  questions: Array<{
    id: string
    itemId: string
    itemType: 'word' | 'kanji'
  }>
): Array<{
  itemId: string
  itemType: 'word' | 'kanji'
  isCorrect: boolean
  timeSpent: number
}> {
  return answers.map((answer) => {
    const question = questions.find((q) => q.id === answer.questionId)
    if (!question) {
      throw new Error(`Question not found: ${answer.questionId}`)
    }

    return {
      itemId: question.itemId,
      itemType: question.itemType,
      isCorrect: answer.isCorrect,
      timeSpent: answer.timeSpent,
    }
  })
}

/**
 * 정답률 계산
 */
export function calculateAccuracy(correctCount: number, totalCount: number): number {
  if (totalCount === 0) return 0
  return correctCount / totalCount
}

/**
 * 평균 응답 시간 계산 (밀리초)
 */
export function calculateAverageTime(answers: QuizAnswer[]): number {
  if (answers.length === 0) return 0
  const totalTime = answers.reduce((sum, answer) => sum + answer.timeSpent, 0)
  return totalTime / answers.length
}

/**
 * 연속 정답 수 계산
 */
export function calculateStreak(answers: QuizAnswer[]): {
  currentStreak: number
  maxStreak: number
} {
  let currentStreak = 0
  let maxStreak = 0

  for (const answer of answers) {
    if (answer.isCorrect) {
      currentStreak++
      maxStreak = Math.max(maxStreak, currentStreak)
    } else {
      currentStreak = 0
    }
  }

  return { currentStreak, maxStreak }
}

/**
 * 틀린 문제 추출
 */
export function extractWrongAnswers(answers: QuizAnswer[]): QuizAnswer[] {
  return answers.filter((answer) => !answer.isCorrect)
}

/**
 * 아이템별 통계 집계
 */
export function aggregateItemStats(
  answers: QuizAnswer[],
  questions: Array<{
    id: string
    itemId: string
    itemType: 'word' | 'kanji'
    level: JlptLevel
  }>
): Record<string, ItemStats> {
  const statsMap: Record<string, ItemStats> = {}

  for (const answer of answers) {
    const question = questions.find((q) => q.id === answer.questionId)
    if (!question) continue

    if (!statsMap[question.itemId]) {
      statsMap[question.itemId] = {
        itemId: question.itemId,
        itemType: question.itemType,
        level: question.level,
        attempts: 0,
        correct: 0,
        wrong: 0,
        accuracy: 0,
        lastAttempt: answer.timestamp,
        averageTimeSpent: 0,
      }
    }

    const stats = statsMap[question.itemId]
    stats.attempts++
    if (answer.isCorrect) {
      stats.correct++
    } else {
      stats.wrong++
    }
    stats.accuracy = stats.correct / stats.attempts
    stats.lastAttempt = Math.max(stats.lastAttempt, answer.timestamp)
    stats.averageTimeSpent =
      (stats.averageTimeSpent * (stats.attempts - 1) + answer.timeSpent) / stats.attempts
  }

  return statsMap
}

/**
 * 레벨별 정답률 분석
 */
export function analyzeLevelPerformance(
  answers: QuizAnswer[],
  questions: Array<{
    id: string
    level: JlptLevel
  }>
): Record<JlptLevel, { correct: number; total: number; accuracy: number }> {
  const levelStats: Record<string, { correct: number; total: number }> = {}

  for (const answer of answers) {
    const question = questions.find((q) => q.id === answer.questionId)
    if (!question) continue

    if (!levelStats[question.level]) {
      levelStats[question.level] = { correct: 0, total: 0 }
    }

    levelStats[question.level].total++
    if (answer.isCorrect) {
      levelStats[question.level].correct++
    }
  }

  const result: any = {}
  for (const [level, stats] of Object.entries(levelStats)) {
    result[level] = {
      ...stats,
      accuracy: calculateAccuracy(stats.correct, stats.total),
    }
  }

  return result
}

