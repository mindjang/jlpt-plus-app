'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import { AppBar } from '@/components/ui/AppBar'
import { LoginRequiredScreen } from '@/components/auth/LoginRequiredScreen'
import { BadgeGallery } from '@/components/quiz/BadgeGallery'
import { getUserQuizLevel, getAllQuizStats } from '@/lib/firebase/firestore/quiz'
import type { UserQuizLevel, QuizStats } from '@/lib/types/quiz'
import type { JlptLevel } from '@/lib/types/content'

export default function BadgesPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [userLevel, setUserLevel] = useState<UserQuizLevel | null>(null)
  const [allStats, setAllStats] = useState<Record<JlptLevel, QuizStats> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  const loadData = async () => {
    if (!user) return

    setLoading(true)
    try {
      const [level, stats] = await Promise.all([
        getUserQuizLevel(user.uid),
        getAllQuizStats(user.uid),
      ])
      setUserLevel(level)
      setAllStats(stats)
    } catch (error) {
      console.error('[BadgesPage] Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-body text-text-sub">로딩 중...</div>
      </div>
    )
  }

  if (!user || !userLevel || !allStats) {
    return (
      <LoginRequiredScreen
        title="배지 갤러리"
        showBackButton
        onBack={() => router.back()}
        description="배지를 확인하려면\n로그인이 필요합니다."
      />
    )
  }

  // 통계 계산
  const totalSessions = Object.values(allStats).reduce(
    (sum, stats) => sum + stats.totalSessions,
    0
  )
  const totalQuestions = Object.values(allStats).reduce(
    (sum, stats) => sum + stats.totalQuestions,
    0
  )

  const levelStatsForBadges: Record<JlptLevel, { correct: number; total: number; accuracy: number }> = {} as any
  ;(['N5', 'N4', 'N3', 'N2', 'N1'] as JlptLevel[]).forEach((level) => {
    const stats = allStats[level]
    levelStatsForBadges[level] = {
      correct: stats.correctAnswers,
      total: stats.totalQuestions,
      accuracy: stats.averageAccuracy,
    }
  })

  return (
    <div className="min-h-screen pb-20">
      <AppBar title="배지 갤러리" onBack={() => router.back()} />

      <div className="p-4 max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="bg-surface rounded-card shadow-soft p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-display-s font-bold text-text-main mb-2">
                획득한 배지
              </h1>
              <p className="text-body text-text-sub">
                {userLevel.badges.length}개 획득
              </p>
            </div>
            <div className="text-display-m font-bold text-primary">
              🏆
            </div>
          </div>
        </div>

        {/* 배지 갤러리 */}
        <BadgeGallery
          userLevel={userLevel}
          totalSessionsCompleted={totalSessions}
          totalQuestionsAnswered={totalQuestions}
          consecutiveDays={1} // TODO: 실제 연속 일수 계산 구현 필요
          levelStats={levelStatsForBadges}
        />
      </div>
    </div>
  )
}

