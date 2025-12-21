'use client'

import React, { useState, useEffect, Suspense, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import { FeatureGuard } from '@/components/permissions/FeatureGuard'
import { AppBar } from '@/components/ui/AppBar'
import { QuizCard } from '@/components/study/QuizCard'
import { QuizSettingsModal } from '@/components/quiz/QuizSettings'
import { QuizResultScreen } from '@/components/quiz/QuizResult'
import { LevelUpModal } from '@/components/quiz/LevelUpModal'
import type {
  QuizSettings,
  QuizSession,
  QuizQuestion,
  QuizAnswer,
  QuizResult,
  UserQuizLevel,
  QuizStats,
} from '@/lib/types/quiz'
import { generateQuizQuestions, getItemId } from '@/lib/quiz/questionGenerator'
import { calculateExp, addExp } from '@/lib/quiz/expSystem'
import { extractItemResults, calculateStreak, extractWrongAnswers } from '@/lib/quiz/statsTracker'
import { checkNewBadges } from '@/lib/quiz/badgeSystem'
import { getUserQuizLevel, updateQuizLevel, getQuizStats, updateQuizStats, saveQuizSession, getAllQuizStats } from '@/lib/firebase/firestore/quiz'
import type { JlptLevel } from '@/lib/types/content'
import { updateDailyActivity, updateStreak, isFirstStudyToday } from '@/lib/firebase/firestore/dailyActivity'

import { QuizMenu } from '@/components/quiz/QuizMenu'
import { ConfirmModal } from '@/components/ui/ConfirmModal'

type QuizState = 'menu' | 'settings' | 'playing' | 'result'

function QuizContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading: authLoading } = useAuth()
  
  const [quizState, setQuizState] = useState<QuizState>('menu')
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [allStats, setAllStats] = useState<Record<JlptLevel, QuizStats> | null>(null)
  const [session, setSession] = useState<QuizSession | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<QuizAnswer[]>([])
  const [startTime, setStartTime] = useState(Date.now())
  const [questionStartTime, setQuestionStartTime] = useState(Date.now())
  const [streakCount, setStreakCount] = useState(0)
  const [maxStreak, setMaxStreak] = useState(0)
  const [userLevel, setUserLevel] = useState<UserQuizLevel | null>(null)
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  
  // URL state 파라미터와 내부 상태 동기화
  useEffect(() => {
    const urlState = searchParams.get('state') || searchParams.get('status')
    
    // URL에 state가 없는데 playing 상태면 메뉴로 복귀
    if (!urlState && quizState === 'playing' && session) {
      // 뒤로가기로 URL만 변경된 경우
      setQuizState('menu')
      setSession(null)
      setCurrentQuestionIndex(0)
      setAnswers([])
      setStreakCount(0)
      setMaxStreak(0)
    }
    // URL에 state가 playing인데 내부 상태가 다르면 동기화
    else if (urlState === 'playing' && quizState !== 'playing') {
      // 이 경우는 보통 발생하지 않지만, 안전을 위해 처리
      if (session) {
        setQuizState('playing')
      }
    }
  }, [searchParams, quizState, session])
  
  // 브라우저 뒤로가기 이벤트 처리
  useEffect(() => {
    const handlePopState = () => {
      // 뒤로가기로 URL이 변경되면 상태도 초기화
      if (quizState === 'playing' && session) {
        setQuizState('menu')
        setSession(null)
        setCurrentQuestionIndex(0)
        setAnswers([])
        setStreakCount(0)
        setMaxStreak(0)
      }
    }
    
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [quizState, session])

  // 사용자 레벨 정보 및 통계 로드
  useEffect(() => {
    if (user) {
      Promise.all([
        getUserQuizLevel(user.uid),
        getAllQuizStats(user.uid)
      ]).then(([level, stats]) => {
        setUserLevel(level)
        setAllStats(stats)
      })
    }
  }, [user])

  const handleOpenSettings = () => {
    setShowSettingsModal(true)
    setQuizState('settings')
  }

  const handleStartQuiz = async (settings: QuizSettings) => {
    if (!user) return
    
    setLoading(true)
    setShowSettingsModal(false)
    
    // URL 변경: 퀴즈 진행 중 표시
    router.push('/quiz?state=playing', { scroll: false })

    try {
      // 약점 데이터 로드
      const allStats = await getAllQuizStats(user.uid)
      const weakItemsMap: Record<string, any> = {}
      
      for (const level of settings.levels) {
        const stats = allStats[level]
        if (stats) {
          Object.assign(weakItemsMap, stats.itemStats)
        }
      }

      // 문제 생성
      const questions = await generateQuizQuestions(settings, weakItemsMap)

      if (questions.length === 0) {
        alert('생성할 문제가 없습니다. 다른 설정을 선택해주세요.')
        setShowSettingsModal(true)
        setLoading(false)
        return
      }

      // 세션 초기화
      const newSession: QuizSession = {
        sessionId: `${user.uid}-${Date.now()}`,
        uid: user.uid,
        settings,
        questions,
        answers: [],
        currentQuestionIndex: 0,
        startTime: Date.now(),
        score: 0,
        correctCount: 0,
        totalQuestions: questions.length,
        expGained: 0,
        badgesEarned: [],
        streakCount: 0,
        maxStreak: 0,
      }

      setSession(newSession)
      setCurrentQuestionIndex(0)
      setAnswers([])
      setStartTime(Date.now())
      setQuestionStartTime(Date.now())
      setStreakCount(0)
      setMaxStreak(0)
      setQuizState('playing')
      
      // URL 업데이트 (이미 위에서 변경했지만 확실히)
      router.replace('/quiz?state=playing', { scroll: false })
    } catch (error) {
      console.error('[QuizPage] Error starting quiz:', error)
      alert('퀴즈 시작 중 오류가 발생했습니다.')
      setShowSettingsModal(true)
    } finally {
      setLoading(false)
    }
  }

  const handleAnswer = async (selectedAnswer: string) => {
    if (!session || !user || !userLevel) return

    const currentQuestion = session.questions[currentQuestionIndex]
    const now = Date.now()
    const timeSpent = now - questionStartTime
    const isCorrect = selectedAnswer === currentQuestion.answer

    // 답안 기록
    const answer: QuizAnswer = {
      questionId: currentQuestion.id,
      selectedAnswer,
      correctAnswer: currentQuestion.answer,
      isCorrect,
      timeSpent,
      timestamp: now,
    }

    const newAnswers = [...answers, answer]
    setAnswers(newAnswers)

    // 연속 정답 업데이트
    const newStreakCount = isCorrect ? streakCount + 1 : 0
    setStreakCount(newStreakCount)
    setMaxStreak(Math.max(maxStreak, newStreakCount))

    // 다음 문제로 이동 또는 종료
    if (currentQuestionIndex + 1 < session.questions.length) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      setQuestionStartTime(Date.now())
    } else {
      // 퀴즈 완료
      await finishQuiz(newAnswers, newStreakCount, Math.max(maxStreak, newStreakCount))
    }
  }

  const finishQuiz = async (
    finalAnswers: QuizAnswer[],
    finalStreakCount: number,
    finalMaxStreak: number
  ) => {
    if (!session || !user || !userLevel) return

    setLoading(true)

    try {
      const endTime = Date.now()
      const correctCount = finalAnswers.filter((a) => a.isCorrect).length
      const score = Math.round((correctCount / session.questions.length) * 100)
      const averageTimePerQuestion =
        finalAnswers.reduce((sum, a) => sum + a.timeSpent, 0) / finalAnswers.length

      // 경험치 계산
      let totalExp = 0
      for (const answer of finalAnswers) {
        const questionStreakAtTime = finalAnswers.slice(0, finalAnswers.indexOf(answer) + 1)
          .reverse()
          .findIndex((a) => !a.isCorrect)
        const streakAtTime = questionStreakAtTime === -1 ? finalAnswers.indexOf(answer) + 1 : questionStreakAtTime
        totalExp += calculateExp(answer.isCorrect, streakAtTime, answer.timeSpent)
      }

      // 레벨업 확인
      const levelUpResult = addExp(userLevel, totalExp)
      const leveledUp = levelUpResult.leveledUp

      // 레벨별 통계 계산 (현재 세션 기반)
      const sessionLevelStats: Record<JlptLevel, { correct: number; total: number; accuracy: number }> = {
        N5: { correct: 0, total: 0, accuracy: 0 },
        N4: { correct: 0, total: 0, accuracy: 0 },
        N3: { correct: 0, total: 0, accuracy: 0 },
        N2: { correct: 0, total: 0, accuracy: 0 },
        N1: { correct: 0, total: 0, accuracy: 0 },
      }

      // 현재 세션의 레벨별 통계 계산
      finalAnswers.forEach((answer, index) => {
        const question = session.questions[index]
        const level = question.level as JlptLevel
        sessionLevelStats[level].total++
        if (answer.isCorrect) {
          sessionLevelStats[level].correct++
        }
      })

      // 정확도 계산
      ;(['N5', 'N4', 'N3', 'N2', 'N1'] as JlptLevel[]).forEach((level) => {
        if (sessionLevelStats[level].total > 0) {
          sessionLevelStats[level].accuracy =
            sessionLevelStats[level].correct / sessionLevelStats[level].total
        }
      })

      // 배지 확인 (간단한 버전 - 히스토리 기반 배지는 나중에 구현)
      const newBadges = checkNewBadges(
        { ...session, endTime, maxStreak: finalMaxStreak },
        userLevel,
        1, // 간단한 버전
        session.questions.length,
        1,
        sessionLevelStats
      )

      // Firestore 업데이트
      await updateQuizLevel(user.uid, totalExp, newBadges)

      // 통계 업데이트
      const itemResults = extractItemResults(
        finalAnswers,
        session.questions.map((q) => ({
          id: q.id,
          itemId: q.itemId,
          itemType: q.itemType,
        }))
      )

      for (const level of session.settings.levels) {
        const levelItemResults = itemResults.filter((r) => {
          const question = session.questions.find((q) => q.itemId === r.itemId)
          return question?.level === level
        })

        if (levelItemResults.length > 0) {
          await updateQuizStats(user.uid, level, {
            correctCount: levelItemResults.filter((r) => r.isCorrect).length,
            totalQuestions: levelItemResults.length,
            score,
            itemResults: levelItemResults,
          })
        }
      }

      // 세션 저장
      const completedSession: QuizSession = {
        ...session,
        answers: finalAnswers,
        endTime,
        score,
        correctCount,
        expGained: totalExp,
        badgesEarned: newBadges,
        maxStreak: finalMaxStreak,
      }
      await saveQuizSession(user.uid, completedSession)

      // 일별 활동 통계 업데이트
      const totalTime = endTime - session.startTime
      for (const answer of finalAnswers) {
        const question = session.questions.find((q) => q.id === answer.questionId)
        if (question) {
          await updateDailyActivity(user.uid, {
            mode: 'quiz',
            questions: 1,
            correct: answer.isCorrect ? 1 : 0,
            timeSpent: answer.timeSpent,
            contentType: question.itemType,
            level: question.level,
            quizType: question.type,
          })
        }
      }

      // 연속 일수 업데이트 (매일 첫 학습)
      const isFirst = await isFirstStudyToday(user.uid)
      if (isFirst) {
        await updateStreak(user.uid)
      }

      // 결과 생성
      const wrongAnswers = extractWrongAnswers(finalAnswers)
      const result: QuizResult = {
        sessionId: session.sessionId,
        score,
        correctCount,
        totalQuestions: session.questions.length,
        expGained: totalExp,
        leveledUp,
        newLevel: leveledUp ? levelUpResult.newLevel.level : undefined,
        badgesEarned: newBadges,
        averageTimePerQuestion,
        accuracy: correctCount / session.questions.length,
        weakPoints: wrongAnswers.map((answer) => {
          const question = session.questions.find((q) => q.id === answer.questionId)!
          return {
            itemId: question.itemId,
            itemType: question.itemType,
            question: question.question,
            correctAnswer: answer.correctAnswer,
            userAnswer: answer.selectedAnswer,
          }
        }),
        completedAt: endTime,
      }

      setQuizResult(result)
      setUserLevel(levelUpResult.newLevel)
      
      // sessionStorage에 결과 저장
      sessionStorage.setItem('quizResult', JSON.stringify(result))
      
      // 결과 화면으로 리다이렉트
      router.push('/quiz/result')

      if (leveledUp) {
        // 레벨업 모달은 결과 페이지에서 처리
        // 여기서는 바로 리다이렉트
      }
    } catch (error) {
      console.error('[QuizPage] Error finishing quiz:', error)
      alert('퀴즈 완료 처리 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleRestart = () => {
    // 이 함수는 더 이상 사용되지 않음 (결과 페이지에서 처리)
    // 하지만 호환성을 위해 유지
    setQuizState('menu')
    setShowSettingsModal(false)
    setSession(null)
    setCurrentQuestionIndex(0)
    setAnswers([])
    setStreakCount(0)
    setMaxStreak(0)
    setQuizResult(null)
    
    // URL을 메뉴로 복원
    router.replace('/quiz', { scroll: false })
    
    // 통계 다시 로드
    if (user) {
      getAllQuizStats(user.uid).then(setAllStats)
    }
  }

  const handleBack = () => {
    // 퀴즈 진행 중일 때는 확인 모달 표시
    if (quizState === 'playing' && session) {
      setShowExitConfirm(true)
    } else {
      // URL에서 state 파라미터 제거하고 메뉴로 이동
      router.replace('/quiz', { scroll: false })
    }
  }

  const handleExitConfirm = () => {
    // 퀴즈 상태 초기화
    setQuizState('menu')
    setSession(null)
    setCurrentQuestionIndex(0)
    setAnswers([])
    setStreakCount(0)
    setMaxStreak(0)
    setShowExitConfirm(false)
    
    // 퀴즈 메인으로 이동
    router.replace('/quiz', { scroll: false })
    
    // 통계 다시 로드
    if (user) {
      getAllQuizStats(user.uid).then(setAllStats)
    }
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-body text-text-sub">로딩 중...</div>
      </div>
    )
  }

  if (!user) {
    return null // FeatureGuard가 처리
  }

  return (
    <div className="min-h-screen">
      <AppBar
        title="퀴즈"
        onBack={() => router.back()}
        className="bg-transparent border-none"
      />

      {/* 메뉴 화면 */}
      {quizState === 'menu' && userLevel && allStats && (
        <QuizMenu
          userLevel={userLevel}
          allStats={allStats}
          onStartQuiz={handleOpenSettings}
        />
      )}

      {/* 설정 모달 */}
      <QuizSettingsModal
        isOpen={showSettingsModal}
        onClose={() => {
          setShowSettingsModal(false)
          if (quizState === 'settings') {
            setQuizState('menu')
          }
        }}
        onStart={handleStartQuiz}
      />

      {/* 퀴즈 진행 중 */}
      {quizState === 'playing' && session && !loading && (
        <div className="py-8">
          <QuizCard
            question={session.questions[currentQuestionIndex]}
            questionNumber={currentQuestionIndex + 1}
            totalQuestions={session.questions.length}
            onAnswer={handleAnswer}
          />
        </div>
      )}


      {/* 로딩 오버레이 */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-surface rounded-lg border border-divider p-8">
            <div className="text-title text-text-main">처리 중...</div>
          </div>
        </div>
      )}

      {/* 퀴즈 나가기 확인 모달 */}
      <ConfirmModal
        isOpen={showExitConfirm}
        onClose={() => setShowExitConfirm(false)}
        onConfirm={handleExitConfirm}
        title="퀴즈 나가기"
        message="퀴즈를 중단하고 나가시겠습니까?<br />진행 상황은 저장되지 않습니다."
        confirmText="나가기"
        cancelText="계속하기"
        confirmButtonColor="danger"
      />
    </div>
  )
}

export default function QuizPage() {
  return (
    <FeatureGuard
      feature="quiz_start"
      customMessage={{
        title: '퀴즈',
        description: '퀴즈를 시작하려면 로그인이 필요합니다.',
      }}
    >
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-body text-text-sub">로딩 중...</div>
        </div>
      }
    >
      <QuizContent />
    </Suspense>
    </FeatureGuard>
  )
}
