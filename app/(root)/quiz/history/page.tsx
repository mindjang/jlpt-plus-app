'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import { AppBar } from '@/components/ui/AppBar'
import { FeatureGuard } from '@/components/permissions/FeatureGuard'
import type { QuizHistorySummary } from '@/lib/types/quiz'
import { getQuizHistory } from '@/lib/firebase/firestore/quiz'
import { motion } from 'framer-motion'

export default function QuizHistoryPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [history, setHistory] = useState<QuizHistorySummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadHistory()
    }
  }, [user])

  const loadHistory = async () => {
    if (!user) return

    setLoading(true)
    try {
      const data = await getQuizHistory(user.uid, 50)
      setHistory(data)
    } catch (error) {
      console.error('[QuizHistoryPage] Error loading history:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}분 ${seconds}초`
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-body text-text-sub">로딩 중...</div>
      </div>
    )
  }

  return (
    <FeatureGuard
      feature="quiz_history"
      customMessage={{
        title: '퀴즈 히스토리',
        description: '퀴즈 기록을 확인하려면 로그인이 필요합니다.',
      }}
    >
    <div className="w-full overflow-hidden bg-page min-h-screen">
      <AppBar title="퀴즈 히스토리" onBack={() => router.back()} />

      <div className="flex flex-col gap-4 p-4 pb-20">
        {history.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-title mb-3">📝</div>
            <p className="text-body text-text-main mb-1.5">아직 퀴즈 기록이 없습니다</p>
            <p className="text-label text-text-sub mb-4">
              첫 퀴즈를 시작해보세요!
            </p>
            <button
              onClick={() => router.push('/quiz')}
              className="px-5 py-3 bg-primary text-white rounded-lg text-body font-semibold active:opacity-90"
            >
              퀴즈 시작하기
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((item, index) => (
              <motion.div
                key={item.sessionId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-surface rounded-lg border border-divider p-4"
              >
                {/* 날짜 */}
                <div className="text-label text-text-sub mb-2.5">
                  {formatDate(item.date)}
                </div>

                {/* 점수 및 통계 */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="text-title font-bold text-text-main">
                      {item.score}점
                    </div>
                    <div className="text-body text-text-sub">
                      {item.correctCount} / {item.totalQuestions}
                    </div>
                  </div>
                  
                  {/* 경험치 */}
                  <div className="text-body font-semibold text-text-main">
                    +{item.expGained} EXP
                  </div>
                </div>

                {/* 상세 정보 */}
                <div className="flex flex-wrap gap-2">
                  {/* 레벨 태그 */}
                  <div className="flex items-center gap-1">
                    {item.levels.map((level) => (
                      <span
                        key={level}
                        className="px-2 py-0.5 bg-gray-100 text-text-sub text-label rounded"
                      >
                        {level}
                      </span>
                    ))}
                  </div>

                  {/* 소요 시간 */}
                  <div className="text-label text-text-sub">
                    ⏱️ {formatDuration(item.duration)}
                  </div>

                  {/* 정답률 */}
                  <div className="text-label text-text-sub">
                    🎯 {Math.round((item.correctCount / item.totalQuestions) * 100)}%
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
    </FeatureGuard>
  )
}

