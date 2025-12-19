'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import { FeatureGuard } from '@/components/permissions/FeatureGuard'
import { QuizResultScreen } from '@/components/quiz/QuizResult'
import { LevelUpModal } from '@/components/quiz/LevelUpModal'
import type { QuizResult, UserQuizLevel } from '@/lib/types/quiz'
import { getUserQuizLevel } from '@/lib/firebase/firestore/quiz'

function QuizResultContent() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null)
  const [userLevel, setUserLevel] = useState<UserQuizLevel | null>(null)
  const [showLevelUpModal, setShowLevelUpModal] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      if (!authLoading) {
        router.push('/quiz')
      }
      return
    }

    // sessionStorage에서 결과 데이터 가져오기
    const storedResult = sessionStorage.getItem('quizResult')
    if (storedResult) {
      try {
        const result = JSON.parse(storedResult)
        setQuizResult(result)
        
        // 레벨 정보 로드
        getUserQuizLevel(user.uid).then((level) => {
          setUserLevel(level)
          setLoading(false)
          
          // 레벨업이 발생했으면 모달 표시
          if (result.leveledUp && result.newLevel) {
            setShowLevelUpModal(true)
          }
        })
      } catch (error) {
        console.error('[QuizResultPage] Error parsing result:', error)
        router.push('/quiz')
      }
    } else {
      // 결과 데이터가 없으면 메뉴로 리다이렉트
      router.push('/quiz')
    }
  }, [user, authLoading, router])

  const handleRestart = () => {
    // sessionStorage 정리
    sessionStorage.removeItem('quizResult')
    // 메뉴로 이동
    router.push('/quiz')
  }

  const handleReviewWrong = () => {
    // 틀린 문제 복습 기능 (나중에 구현 가능)
    console.log('Review wrong answers')
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-body text-text-sub">로딩 중...</div>
      </div>
    )
  }

  if (!user) {
    return null // FeatureGuard가 처리
  }

  if (!quizResult || !userLevel) {
    return null
  }

  return (
    <FeatureGuard
      feature="quiz_start"
      customMessage={{
        title: '퀴즈 결과',
        description: '퀴즈 결과를 보려면 로그인이 필요합니다.',
      }}
    >
    <div className="min-h-screen">
      <QuizResultScreen
        result={quizResult}
        currentLevel={userLevel.level}
        onRestart={handleRestart}
        onReviewWrong={quizResult.weakPoints.length > 0 ? handleReviewWrong : undefined}
      />

      {/* 레벨업 모달 */}
      {quizResult.leveledUp && quizResult.newLevel && (
        <LevelUpModal
          isOpen={showLevelUpModal}
          newLevel={quizResult.newLevel}
          onClose={() => setShowLevelUpModal(false)}
        />
      )}
    </div>
    </FeatureGuard>
  )
}

export default function QuizResultPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-body text-text-sub">로딩 중...</div>
        </div>
      }
    >
      <QuizResultContent />
    </Suspense>
  )
}
