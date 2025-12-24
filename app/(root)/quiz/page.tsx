'use client'

import React, { useState, useEffect, Suspense, useRef } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
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
import { generateQuizQuestions } from '@/lib/quiz/questionGenerator'
import { calculateExp, addExp } from '@/lib/quiz/expSystem'
import { extractItemResults, extractWrongAnswers } from '@/lib/quiz/statsTracker'
import { checkNewBadges } from '@/lib/quiz/badgeSystem'
import { getUserQuizLevel, updateQuizLevel, updateQuizStats, saveQuizSession, getAllQuizStats } from '@/lib/firebase/firestore/quiz'
import type { JlptLevel } from '@/lib/types/content'
import { updateDailyActivity, updateStreak, isFirstStudyToday } from '@/lib/firebase/firestore/dailyActivity'

import { QuizMenu } from '@/components/quiz/QuizMenu'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { BrandLoader } from '@/components/ui/BrandLoader'

type QuizState = 'menu' | 'settings' | 'playing' | 'result'

function QuizContent() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { user, loading: authLoading } = useAuth()

  // 경로 기반으로 초기 상태 결정
  const isPlayingPage = pathname === '/quiz/playing'
  const [quizState, setQuizState] = useState<QuizState>(isPlayingPage ? 'playing' : 'menu')
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [allStats, setAllStats] = useState<Record<JlptLevel, QuizStats> | null>(null)
  const [session, setSession] = useState<QuizSession | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<QuizAnswer[]>([])
  const [questionStartTime, setQuestionStartTime] = useState(Date.now())
  const [streakCount, setStreakCount] = useState(0)
  const [maxStreak, setMaxStreak] = useState(0)
  const [userLevel, setUserLevel] = useState<UserQuizLevel | null>(null)
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [showExitConfirm, setShowExitConfirm] = useState(false)

  // /quiz/playing 경로로 직접 접근하면 리다이렉트
  useEffect(() => {
    if (pathname === '/quiz/playing') {
      router.replace('/quiz')
    }
  }, [pathname, router])

  // URL 파라미터로 설정 모달 열기 (다시 퀴즈 시작 버튼에서 사용)
  useEffect(() => {
    if (pathname === '/quiz' && searchParams.get('start') === 'true') {
      setShowSettingsModal(true)
      setQuizState('settings')
      // URL에서 파라미터 제거
      router.replace('/quiz', { scroll: false })
    }
  }, [pathname, searchParams, router])

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
        // 상태 복원
        setQuizState('settings')
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

      // sessionStorage에 세션 저장
      sessionStorage.setItem('quizSession', JSON.stringify(newSession))

      // 세션 설정 후 URL 변경
      router.push('/quiz/playing', { scroll: false })
    } catch (error) {
      console.error('[QuizPage] Error starting quiz:', error)
      alert('퀴즈 시작 중 오류가 발생했습니다.')
      // 상태 복원
      setQuizState('settings')
      setShowSettingsModal(true)
    } finally {
      setLoading(false)
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
        className="bg-transparent border-none"
      />

      {/* 메뉴 화면 - /quiz 경로에서만 표시 */}
      {pathname === '/quiz' && quizState === 'menu' && userLevel && allStats && (
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



      {/* 로딩 오버레이 */}
      {loading && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <BrandLoader fullScreen={false} text="문제를 만들고 있어요..." />
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
