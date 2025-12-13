/**
 * 일별 활동 통계 Firestore CRUD
 */
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  increment,
} from 'firebase/firestore'
import type { DailyActivity, StreakData } from '@/lib/types/stats'
import type { JlptLevel } from '@/lib/types/content'
import type { QuizQuestionType } from '@/lib/types/quiz'
import { getDbInstance } from './utils'

/**
 * 날짜를 YYYY-MM-DD 형식으로 포맷
 */
function formatDate(date: Date = new Date()): string {
  return date.toISOString().split('T')[0]
}

/**
 * 일별 활동 업데이트
 * 모든 학습 활동(예문, 퀴즈, 게임)에서 호출
 */
export async function updateDailyActivity(
  uid: string,
  data: {
    mode: 'exampleStudy' | 'quiz' | 'game'
    questions: number
    correct: number
    timeSpent: number // 밀리초
    contentType: 'word' | 'kanji'
    level: JlptLevel
    quizType?: QuizQuestionType
  }
): Promise<void> {
  const dbInstance = getDbInstance()
  const today = formatDate()
  const activityRef = doc(dbInstance, 'users', uid, 'dailyActivity', today)

  try {
    const activitySnap = await getDoc(activityRef)
    const now = Date.now()

    if (activitySnap.exists()) {
      // 기존 데이터 업데이트
      const existing = activitySnap.data() as DailyActivity

      const updatedActivity: DailyActivity = {
        ...existing,
        totalTime: existing.totalTime + data.timeSpent,
        totalQuestions: existing.totalQuestions + data.questions,
        modeBreakdown: {
          exampleStudy: {
            questions: existing.modeBreakdown.exampleStudy.questions + (data.mode === 'exampleStudy' ? data.questions : 0),
            time: existing.modeBreakdown.exampleStudy.time + (data.mode === 'exampleStudy' ? data.timeSpent : 0),
          },
          quiz: {
            questions: existing.modeBreakdown.quiz.questions + (data.mode === 'quiz' ? data.questions : 0),
            time: existing.modeBreakdown.quiz.time + (data.mode === 'quiz' ? data.timeSpent : 0),
          },
          game: {
            questions: existing.modeBreakdown.game.questions + (data.mode === 'game' ? data.questions : 0),
            time: existing.modeBreakdown.game.time + (data.mode === 'game' ? data.timeSpent : 0),
          },
        },
        contentBreakdown: {
          word: {
            questions: existing.contentBreakdown.word.questions + (data.contentType === 'word' ? data.questions : 0),
            correct: existing.contentBreakdown.word.correct + (data.contentType === 'word' ? data.correct : 0),
          },
          kanji: {
            questions: existing.contentBreakdown.kanji.questions + (data.contentType === 'kanji' ? data.questions : 0),
            correct: existing.contentBreakdown.kanji.correct + (data.contentType === 'kanji' ? data.correct : 0),
          },
        },
        levelBreakdown: {
          ...existing.levelBreakdown,
          [data.level]: (existing.levelBreakdown[data.level] || 0) + data.questions,
        },
        sessions: existing.sessions + 1,
        lastSessionAt: now,
        updatedAt: now,
      }

      // 퀴즈 타입별 분류 업데이트
      if (data.mode === 'quiz' && data.quizType) {
        const quizBreakdown = existing.quizTypeBreakdown || {
          wordToMeaning: 0,
          meaningToWord: 0,
          sentenceFillIn: 0,
        }

        if (data.quizType === 'word-to-meaning') quizBreakdown.wordToMeaning += data.questions
        if (data.quizType === 'meaning-to-word') quizBreakdown.meaningToWord += data.questions
        if (data.quizType === 'sentence-fill-in') quizBreakdown.sentenceFillIn += data.questions

        updatedActivity.quizTypeBreakdown = quizBreakdown
      }

      await setDoc(activityRef, updatedActivity)
    } else {
      // 새 문서 생성
      const newActivity: DailyActivity = {
        date: today,
        totalTime: data.timeSpent,
        totalQuestions: data.questions,
        modeBreakdown: {
          exampleStudy: {
            questions: data.mode === 'exampleStudy' ? data.questions : 0,
            time: data.mode === 'exampleStudy' ? data.timeSpent : 0,
          },
          quiz: {
            questions: data.mode === 'quiz' ? data.questions : 0,
            time: data.mode === 'quiz' ? data.timeSpent : 0,
          },
          game: {
            questions: data.mode === 'game' ? data.questions : 0,
            time: data.mode === 'game' ? data.timeSpent : 0,
          },
        },
        contentBreakdown: {
          word: {
            questions: data.contentType === 'word' ? data.questions : 0,
            correct: data.contentType === 'word' ? data.correct : 0,
          },
          kanji: {
            questions: data.contentType === 'kanji' ? data.questions : 0,
            correct: data.contentType === 'kanji' ? data.correct : 0,
          },
        },
        levelBreakdown: {
          N5: data.level === 'N5' ? data.questions : 0,
          N4: data.level === 'N4' ? data.questions : 0,
          N3: data.level === 'N3' ? data.questions : 0,
          N2: data.level === 'N2' ? data.questions : 0,
          N1: data.level === 'N1' ? data.questions : 0,
        },
        sessions: 1,
        firstSessionAt: now,
        lastSessionAt: now,
        updatedAt: now,
      }

      // 퀴즈 타입별 분류 (초기화)
      if (data.mode === 'quiz' && data.quizType) {
        newActivity.quizTypeBreakdown = {
          wordToMeaning: data.quizType === 'word-to-meaning' ? data.questions : 0,
          meaningToWord: data.quizType === 'meaning-to-word' ? data.questions : 0,
          sentenceFillIn: data.quizType === 'sentence-fill-in' ? data.questions : 0,
        }
      }

      await setDoc(activityRef, newActivity)
    }
  } catch (error) {
    console.error('[updateDailyActivity] Error:', error)
    throw error
  }
}

/**
 * 특정 날짜의 활동 가져오기
 */
export async function getDailyActivity(
  uid: string,
  date: string = formatDate()
): Promise<DailyActivity | null> {
  const dbInstance = getDbInstance()
  const activityRef = doc(dbInstance, 'users', uid, 'dailyActivity', date)

  try {
    const activitySnap = await getDoc(activityRef)
    return activitySnap.exists() ? (activitySnap.data() as DailyActivity) : null
  } catch (error) {
    console.error('[getDailyActivity] Error:', error)
    return null
  }
}

/**
 * 기간별 활동 가져오기 (히트맵용)
 */
export async function getRangeActivity(
  uid: string,
  startDate: string,
  endDate: string
): Promise<Record<string, DailyActivity>> {
  const dbInstance = getDbInstance()
  const activityRef = collection(dbInstance, 'users', uid, 'dailyActivity')

  try {
    const q = query(
      activityRef,
      where('date', '>=', startDate),
      where('date', '<=', endDate)
    )

    const snapshot = await getDocs(q)
    const activities: Record<string, DailyActivity> = {}

    snapshot.forEach((doc) => {
      const data = doc.data() as DailyActivity
      activities[data.date] = data
    })

    return activities
  } catch (error) {
    console.error('[getRangeActivity] Error:', error)
    return {}
  }
}

/**
 * 연속 일수 업데이트
 * 매일 첫 학습 시 호출
 */
export async function updateStreak(uid: string): Promise<StreakData> {
  const dbInstance = getDbInstance()
  const streakRef = doc(dbInstance, 'users', uid, 'streakData', 'current')

  try {
    const streakSnap = await getDoc(streakRef)
    const today = formatDate()
    const yesterday = formatDate(new Date(Date.now() - 24 * 60 * 60 * 1000))
    const now = Date.now()

    if (streakSnap.exists()) {
      const existing = streakSnap.data() as StreakData

      // 오늘 이미 업데이트 했으면 그대로 반환
      if (existing.lastStudyDate === today) {
        return existing
      }

      let newStreak = 1
      let streakHistory = [...existing.streakHistory]

      // 어제 학습했으면 연속
      if (existing.lastStudyDate === yesterday) {
        newStreak = existing.currentStreak + 1
        
        // 현재 연속 기록 업데이트
        if (streakHistory.length > 0 && streakHistory[streakHistory.length - 1].end === yesterday) {
          streakHistory[streakHistory.length - 1].end = today
          streakHistory[streakHistory.length - 1].days = newStreak
        }
      } else {
        // 연속 끊김 - 새 기록 시작
        streakHistory.push({
          start: today,
          end: today,
          days: 1,
        })
      }

      const updatedStreak: StreakData = {
        currentStreak: newStreak,
        longestStreak: Math.max(existing.longestStreak, newStreak),
        lastStudyDate: today,
        totalDays: existing.totalDays + 1,
        streakHistory,
        updatedAt: now,
      }

      await setDoc(streakRef, updatedStreak)
      return updatedStreak
    } else {
      // 초기화
      const initialStreak: StreakData = {
        currentStreak: 1,
        longestStreak: 1,
        lastStudyDate: today,
        totalDays: 1,
        streakHistory: [
          {
            start: today,
            end: today,
            days: 1,
          },
        ],
        updatedAt: now,
      }

      await setDoc(streakRef, initialStreak)
      return initialStreak
    }
  } catch (error) {
    console.error('[updateStreak] Error:', error)
    throw error
  }
}

/**
 * 연속 일수 가져오기
 */
export async function getStreak(uid: string): Promise<StreakData | null> {
  const dbInstance = getDbInstance()
  const streakRef = doc(dbInstance, 'users', uid, 'streakData', 'current')

  try {
    const streakSnap = await getDoc(streakRef)
    return streakSnap.exists() ? (streakSnap.data() as StreakData) : null
  } catch (error) {
    console.error('[getStreak] Error:', error)
    return null
  }
}

/**
 * 오늘 첫 학습인지 확인
 */
export async function isFirstStudyToday(uid: string): Promise<boolean> {
  const streak = await getStreak(uid)
  const today = formatDate()
  return !streak || streak.lastStudyDate !== today
}

