'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import { AppBar } from '@/components/ui/AppBar'
import { LoginRequiredScreen } from '@/components/auth/LoginRequiredScreen'
import { getUserQuizLevel, getAllQuizStats, getWeakItems } from '@/lib/firebase/firestore/quiz'
import type { UserQuizLevel, QuizStats, ItemStats } from '@/lib/types/quiz'
import type { JlptLevel } from '@/lib/types/content'
import { motion } from 'framer-motion'

export default function QuizStatsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [userLevel, setUserLevel] = useState<UserQuizLevel | null>(null)
  const [allStats, setAllStats] = useState<Record<JlptLevel, QuizStats> | null>(null)
  const [weakItems, setWeakItems] = useState<ItemStats[]>([])
  const [selectedLevel, setSelectedLevel] = useState<JlptLevel>('N5')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  useEffect(() => {
    if (user && selectedLevel) {
      loadWeakItems()
    }
  }, [user, selectedLevel])

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
      console.error('[QuizStatsPage] Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadWeakItems = async () => {
    if (!user) return

    try {
      const items = await getWeakItems(user.uid, selectedLevel, 10)
      setWeakItems(items)
    } catch (error) {
      console.error('[QuizStatsPage] Error loading weak items:', error)
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
        title="퀴즈 통계"
        showBackButton
        onBack={() => router.back()}
        description="퀴즈 통계를 확인하려면\n로그인이 필요합니다."
      />
    )
  }

  const levels: JlptLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1']
  const totalSessions = Object.values(allStats).reduce(
    (sum, stats) => sum + stats.totalSessions,
    0
  )
  const totalQuestions = Object.values(allStats).reduce(
    (sum, stats) => sum + stats.totalQuestions,
    0
  )
  const totalCorrect = Object.values(allStats).reduce(
    (sum, stats) => sum + stats.correctAnswers,
    0
  )

  return (
    <div className="min-h-screen pb-20">
      <AppBar title="퀴즈 통계" onBack={() => router.back()} />

      <div className="p-4 max-w-4xl mx-auto space-y-6">
        {/* 전체 통계 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface rounded-lg border border-divider p-6"
        >
          <h2 className="text-title font-semibold text-text-main mb-4">전체 통계</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-display-s font-bold text-primary mb-1">
                {totalSessions}
              </div>
              <div className="text-label text-text-sub">총 퀴즈</div>
            </div>
            <div className="text-center">
              <div className="text-display-s font-bold text-green-600 mb-1">
                {totalQuestions}
              </div>
              <div className="text-label text-text-sub">총 문제</div>
            </div>
            <div className="text-center">
              <div className="text-display-s font-bold text-yellow-600 mb-1">
                {totalQuestions > 0
                  ? Math.round((totalCorrect / totalQuestions) * 100)
                  : 0}
                %
              </div>
              <div className="text-label text-text-sub">정답률</div>
            </div>
          </div>
        </motion.div>

        {/* 레벨별 통계 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-surface rounded-lg border border-divider p-6"
        >
          <h2 className="text-title font-semibold text-text-main mb-4">레벨별 성과</h2>
          <div className="space-y-4">
            {levels.map((level) => {
              const stats = allStats[level]
              const accuracy = stats.averageAccuracy * 100

              return (
                <div key={level} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-body font-medium text-text-main">{level}</span>
                    <div className="text-right">
                      <span className="text-body font-semibold text-primary mr-2">
                        {Math.round(stats.averageScore)}점
                      </span>
                      <span className="text-label text-text-sub">
                        ({stats.totalQuestions}문제)
                      </span>
                    </div>
                  </div>
                  {stats.totalQuestions > 0 && (
                    <div className="space-y-1">
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            accuracy >= 80
                              ? 'bg-green-500'
                              : accuracy >= 60
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${accuracy}%` }}
                        />
                      </div>
                      <div className="text-label text-text-sub text-right">
                        정답률: {Math.round(accuracy)}%
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </motion.div>

        {/* 약점 분석 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-surface rounded-lg border border-divider p-6"
        >
          <h2 className="text-title font-semibold text-text-main mb-4">약점 분석</h2>
          
          {/* 레벨 선택 */}
          <div className="flex flex-wrap gap-2 mb-4">
            {levels.map((level) => (
              <button
                key={level}
                onClick={() => setSelectedLevel(level)}
                className={`px-4 py-2 rounded-lg text-body font-medium ${
                  selectedLevel === level
                    ? 'bg-primary text-white'
                    : 'bg-surface border border-divider text-text-main active:bg-gray-50'
                }`}
              >
                {level}
              </button>
            ))}
          </div>

          {/* 약점 항목 */}
          {weakItems.length > 0 ? (
            <div className="space-y-2">
              {weakItems.map((item, index) => (
                <div
                  key={item.itemId}
                  className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200"
                >
                  <div>
                    <div className="text-body font-medium text-text-main">
                      {item.itemId.split(':')[1]}
                    </div>
                    <div className="text-label text-text-sub">
                      {item.attempts}회 시도
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-body font-semibold ${
                        item.accuracy >= 0.6
                          ? 'text-yellow-600'
                          : 'text-red-600'
                      }`}
                    >
                      {Math.round(item.accuracy * 100)}%
                    </div>
                    <div className="text-label text-text-sub">
                      정답: {item.correct}/{item.attempts}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-body text-text-sub">
              약점 데이터가 없습니다
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

