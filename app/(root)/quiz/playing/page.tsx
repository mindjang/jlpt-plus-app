'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import { FeatureGuard } from '@/components/permissions/FeatureGuard'
import { AppBar } from '@/components/ui/AppBar'
import { QuizCard } from '@/components/study/QuizCard'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { BrandLoader } from '@/components/ui/BrandLoader'
import type {
  QuizSession,
  QuizAnswer,
  QuizResult,
  UserQuizLevel,
} from '@/lib/types/quiz'
import { getUserQuizLevel, updateQuizLevel, updateQuizStats, saveQuizSession } from '@/lib/firebase/firestore/quiz'
import { calculateExp, addExp } from '@/lib/quiz/expSystem'
import { extractItemResults, extractWrongAnswers } from '@/lib/quiz/statsTracker'
import { checkNewBadges } from '@/lib/quiz/badgeSystem'
import { updateDailyActivity, updateStreak, isFirstStudyToday } from '@/lib/firebase/firestore/dailyActivity'
import type { JlptLevel } from '@/lib/types/content'

function QuizPlayingContent() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  
  const [session, setSession] = useState<QuizSession | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<QuizAnswer[]>([])
  const [questionStartTime, setQuestionStartTime] = useState(Date.now())
  const [streakCount, setStreakCount] = useState(0)
  const [maxStreak, setMaxStreak] = useState(0)
  const [userLevel, setUserLevel] = useState<UserQuizLevel | null>(null)
  const [loading, setLoading] = useState(true)
  const [finishing, setFinishing] = useState(false)
  const [showExitConfirm, setShowExitConfirm] = useState(false)

  // sessionStorage에서 세션 로드 및 사용자 레벨 로드
  useEffect(() => {
    if (!user) return

    const loadData = async () => {
      try {
        const sessionData = sessionStorage.getItem('quizSession')
        if (sessionData) {
          const parsedSession = JSON.parse(sessionData) as QuizSession
          setSession(parsedSession)
          setCurrentQuestionIndex(0)
          setAnswers([])
          setQuestionStartTime(Date.now())
          setStreakCount(0)
          setMaxStreak(0)
          
          // 사용자 레벨 로드
          const level = await getUserQuizLevel(user.uid)
          setUserLevel(level)
        } else {
          // 세션이 없으면 메뉴로 리다이렉트
          router.replace('/quiz')
        }
      } catch (error) {
        console.error('[QuizPlaying] Error loading session:', error)
        router.replace('/quiz')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user, router])

  const handleAnswer = async (selectedAnswer: string) => {
    if (!session || !user) return

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
      // 퀴즈 완료 - 로딩 상태 설정 후 결과 계산
      setFinishing(true)
      await finishQuiz(newAnswers, newStreakCount, Math.max(maxStreak, newStreakCount))
    }
  }

  const finishQuiz = async (
    finalAnswers: QuizAnswer[],
    finalStreakCount: number,
    finalMaxStreak: number
  ) => {
    if (!session || !user || !userLevel) {
      setFinishing(false)
      return
    }

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

      // 배지 확인
      const newBadges = checkNewBadges(
        { ...session, endTime, maxStreak: finalMaxStreak },
        userLevel,
        1,
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

      // sessionStorage에 결과 저장
      sessionStorage.setItem('quizResult', JSON.stringify(result))
      
      // 세션 정리
      sessionStorage.removeItem('quizSession')
      
      // 결과 페이지 로드 완료 플래그 설정
      sessionStorage.setItem('quizResultLoading', 'true')
      
      // 결과 화면으로 리다이렉트
      router.push('/quiz/result')
      
      // 페이지 전환이 완료될 때까지 충분한 딜레이 후 finishing 상태 해제
      // 결과 페이지에서 로딩이 완료되면 플래그를 제거하므로,
      // 여기서는 페이지 전환이 완료될 때까지 기다림
      setTimeout(() => {
        setFinishing(false)
      }, 500)
    } catch (error) {
      console.error('[QuizPlaying] Error finishing quiz:', error)
      alert('퀴즈 완료 처리 중 오류가 발생했습니다.')
      setFinishing(false)
    }
  }

  const handleExitConfirm = () => {
    // 세션 초기화
    sessionStorage.removeItem('quizSession')
    setShowExitConfirm(false)
    router.replace('/quiz')
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <BrandLoader fullScreen={false} text="로딩 중..." />
      </div>
    )
  }

  // 결과 계산 중일 때는 전체 화면 로딩 오버레이 표시
  // router.push() 후에도 finishing 상태를 유지하여 페이지 전환 중에도 로딩 화면 표시
  if (finishing) {
    return (
      <div className="min-h-screen">
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <BrandLoader fullScreen={false} text="결과를 계산하고 있어요..." />
        </div>
        {/* 숨겨진 컨텐츠 (페이지 전환 중 깜빡임 방지) */}
        <div className="opacity-0 pointer-events-none">
          {session && (
            <div className="py-8">
              <QuizCard
                question={session.questions[currentQuestionIndex]}
                questionNumber={currentQuestionIndex + 1}
                totalQuestions={session.questions.length}
                onAnswer={() => {}}
              />
            </div>
          )}
        </div>
      </div>
    )
  }

  if (!user) {
    return null // FeatureGuard가 처리
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-body text-text-sub">퀴즈를 시작해주세요.</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <AppBar
        title="퀴즈"
        onBack={() => setShowExitConfirm(true)}
        className="bg-transparent border-none"
      />

      {/* 퀴즈 진행 중 */}
      <div className="py-8">
        <QuizCard
          question={session.questions[currentQuestionIndex]}
          questionNumber={currentQuestionIndex + 1}
          totalQuestions={session.questions.length}
          onAnswer={handleAnswer}
        />
      </div>

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

export default function QuizPlayingPage() {
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
        <QuizPlayingContent />
      </Suspense>
    </FeatureGuard>
  )
}
