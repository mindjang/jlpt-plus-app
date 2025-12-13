/**
 * 퀴즈 시스템 Firestore CRUD
 */
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  getDocs,
  updateDoc,
  increment,
} from 'firebase/firestore'
import type {
  UserQuizLevel,
  QuizSession,
  QuizStats,
  QuizHistorySummary,
  ItemStats,
} from '@/lib/types/quiz'
import type { JlptLevel } from '@/lib/types/content'
import { getDbInstance } from './utils'

// ============ 레벨 정보 ============

import {
  getCachedUserLevel,
  setCachedUserLevel,
  getCachedStats,
  setCachedStats,
} from '@/lib/quiz/cache'

/**
 * 사용자 퀴즈 레벨 정보 가져오기
 */
export async function getUserQuizLevel(uid: string): Promise<UserQuizLevel> {
  // 캐시 확인
  const cached = getCachedUserLevel(uid)
  if (cached) {
    return cached
  }

  const dbInstance = getDbInstance()
  const levelRef = doc(dbInstance, 'users', uid, 'quizLevel', 'data')
  const levelSnap = await getDoc(levelRef)

  if (levelSnap.exists()) {
    const data = levelSnap.data() as UserQuizLevel
    setCachedUserLevel(uid, data)
    return data
  }

  // 초기화
  const now = Date.now()
  const initialLevel: UserQuizLevel = {
    level: 1,
    exp: 0,
    totalExp: 0,
    expForNextLevel: 100,
    badges: [],
    lastLevelUp: now,
    createdAt: now,
    updatedAt: now,
  }

  await setDoc(levelRef, initialLevel)
  setCachedUserLevel(uid, initialLevel)
  return initialLevel
}

/**
 * 사용자 퀴즈 레벨 업데이트
 */
export async function updateQuizLevel(
  uid: string,
  expGained: number,
  newBadges: string[] = []
): Promise<UserQuizLevel> {
  const dbInstance = getDbInstance()
  const levelRef = doc(dbInstance, 'users', uid, 'quizLevel', 'data')
  
  const currentLevel = await getUserQuizLevel(uid)
  let { level, exp, totalExp, expForNextLevel, badges } = currentLevel

  // 경험치 추가
  exp += expGained
  totalExp += expGained

  // 레벨업 확인
  let leveledUp = false
  while (exp >= expForNextLevel) {
    exp -= expForNextLevel
    level += 1
    leveledUp = true
    expForNextLevel = Math.floor(100 * Math.pow(level, 1.5))
  }

  // 배지 추가 (중복 제거)
  const uniqueBadges = Array.from(new Set([...badges, ...newBadges]))

  const updatedLevel: UserQuizLevel = {
    ...currentLevel,
    level,
    exp,
    totalExp,
    expForNextLevel,
    badges: uniqueBadges,
    lastLevelUp: leveledUp ? Date.now() : currentLevel.lastLevelUp,
    updatedAt: Date.now(),
  }

  await setDoc(levelRef, updatedLevel)
  setCachedUserLevel(uid, updatedLevel)
  return updatedLevel
}

// ============ 통계 ============

/**
 * 레벨별 퀴즈 통계 가져오기
 */
export async function getQuizStats(
  uid: string,
  level: JlptLevel
): Promise<QuizStats> {
  // 캐시 확인
  const cached = getCachedStats(uid, level)
  if (cached) {
    return cached
  }

  const dbInstance = getDbInstance()
  const statsRef = doc(dbInstance, 'users', uid, 'quizStats', level)
  const statsSnap = await getDoc(statsRef)

  if (statsSnap.exists()) {
    const data = statsSnap.data() as QuizStats
    setCachedStats(uid, level, data)
    return data
  }

  // 초기화
  const initialStats: QuizStats = {
    level,
    totalSessions: 0,
    totalQuestions: 0,
    correctAnswers: 0,
    averageAccuracy: 0,
    averageScore: 0,
    itemStats: {},
    lastUpdated: Date.now(),
  }

  await setDoc(statsRef, initialStats)
  setCachedStats(uid, level, initialStats)
  return initialStats
}

/**
 * 퀴즈 통계 업데이트
 */
export async function updateQuizStats(
  uid: string,
  level: JlptLevel,
  sessionResult: {
    correctCount: number
    totalQuestions: number
    score: number
    itemResults: Array<{
      itemId: string
      itemType: 'word' | 'kanji'
      isCorrect: boolean
      timeSpent: number
    }>
  }
): Promise<void> {
  const dbInstance = getDbInstance()
  const statsRef = doc(dbInstance, 'users', uid, 'quizStats', level)
  
  const currentStats = await getQuizStats(uid, level)

  // 전체 통계 업데이트
  const totalSessions = currentStats.totalSessions + 1
  const totalQuestions = currentStats.totalQuestions + sessionResult.totalQuestions
  const correctAnswers = currentStats.correctAnswers + sessionResult.correctCount

  // 평균 계산
  const averageAccuracy = correctAnswers / totalQuestions
  const averageScore =
    (currentStats.averageScore * currentStats.totalSessions + sessionResult.score) /
    totalSessions

  // 아이템별 통계 업데이트
  const updatedItemStats = { ...currentStats.itemStats }

  for (const item of sessionResult.itemResults) {
    const existing = updatedItemStats[item.itemId]

    if (existing) {
      existing.attempts += 1
      existing.correct += item.isCorrect ? 1 : 0
      existing.wrong += item.isCorrect ? 0 : 1
      existing.accuracy = existing.correct / existing.attempts
      existing.lastAttempt = Date.now()
      existing.averageTimeSpent =
        (existing.averageTimeSpent * (existing.attempts - 1) + item.timeSpent) /
        existing.attempts
    } else {
      updatedItemStats[item.itemId] = {
        itemId: item.itemId,
        itemType: item.itemType,
        level,
        attempts: 1,
        correct: item.isCorrect ? 1 : 0,
        wrong: item.isCorrect ? 0 : 1,
        accuracy: item.isCorrect ? 1 : 0,
        lastAttempt: Date.now(),
        averageTimeSpent: item.timeSpent,
      }
    }
  }

  const updatedStats: QuizStats = {
    level,
    totalSessions,
    totalQuestions,
    correctAnswers,
    averageAccuracy,
    averageScore,
    itemStats: updatedItemStats,
    lastUpdated: Date.now(),
  }

  await setDoc(statsRef, updatedStats)
  setCachedStats(uid, level, updatedStats)
}

/**
 * 모든 레벨의 통계 가져오기
 */
export async function getAllQuizStats(uid: string): Promise<Record<JlptLevel, QuizStats>> {
  const levels: JlptLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1']
  const statsPromises = levels.map((level) => getQuizStats(uid, level))
  const statsArray = await Promise.all(statsPromises)

  const statsMap: Record<JlptLevel, QuizStats> = {} as any
  levels.forEach((level, index) => {
    statsMap[level] = statsArray[index]
  })

  return statsMap
}

// ============ 히스토리 ============

/**
 * 퀴즈 세션 저장
 */
export async function saveQuizSession(
  uid: string,
  session: QuizSession
): Promise<string> {
  const dbInstance = getDbInstance()
  const sessionRef = doc(dbInstance, 'users', uid, 'quizHistory', session.sessionId)

  await setDoc(sessionRef, session)
  return session.sessionId
}

/**
 * 퀴즈 히스토리 가져오기
 */
export async function getQuizHistory(
  uid: string,
  limitCount: number = 20
): Promise<QuizHistorySummary[]> {
  const dbInstance = getDbInstance()
  const historyRef = collection(dbInstance, 'users', uid, 'quizHistory')
  
  const q = query(
    historyRef,
    orderBy('startTime', 'desc'),
    firestoreLimit(limitCount)
  )

  const querySnapshot = await getDocs(q)
  const history: QuizHistorySummary[] = []

  querySnapshot.forEach((doc) => {
    const session = doc.data() as QuizSession
    if (session.endTime) {
      history.push({
        sessionId: session.sessionId,
        date: session.endTime,
        levels: session.settings.levels,
        score: session.score,
        correctCount: session.correctCount,
        totalQuestions: session.totalQuestions,
        expGained: session.expGained,
        duration: session.endTime - session.startTime,
      })
    }
  })

  return history
}

/**
 * 특정 세션 상세 정보 가져오기
 */
export async function getQuizSession(
  uid: string,
  sessionId: string
): Promise<QuizSession | null> {
  const dbInstance = getDbInstance()
  const sessionRef = doc(dbInstance, 'users', uid, 'quizHistory', sessionId)
  const sessionSnap = await getDoc(sessionRef)

  if (sessionSnap.exists()) {
    return sessionSnap.data() as QuizSession
  }

  return null
}

// ============ 약점 아이템 ============

/**
 * 약점 아이템 가져오기 (정답률 낮은 순)
 */
export async function getWeakItems(
  uid: string,
  level: JlptLevel,
  limitCount: number = 10
): Promise<ItemStats[]> {
  const stats = await getQuizStats(uid, level)
  const items = Object.values(stats.itemStats)

  // 정답률 낮은 순으로 정렬
  items.sort((a, b) => a.accuracy - b.accuracy)

  return items.slice(0, limitCount)
}

/**
 * 특정 아이템의 통계 가져오기
 */
export async function getItemStats(
  uid: string,
  level: JlptLevel,
  itemId: string
): Promise<ItemStats | null> {
  const stats = await getQuizStats(uid, level)
  return stats.itemStats[itemId] || null
}

