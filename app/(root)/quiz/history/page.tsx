'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import { AppBar } from '@/components/ui/AppBar'
import { LoginRequiredScreen } from '@/components/auth/LoginRequiredScreen'
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

  if (!user) {
    return (
      <LoginRequiredScreen
        title="퀴즈 히스토리"
        showBackButton
        onBack={() => router.back()}
        description="퀴즈 기록을 확인하려면\n로그인이 필요합니다."
      />
    )
  }

  return (
    <div className="min-h-screen pb-20">
      <AppBar title="퀴즈 히스토리" onBack={() => router.back()} />

      <div className="p-4 max-w-4xl mx-auto">
        {history.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-display-s mb-4">📝</div>
            <p className="text-title text-text-main mb-2">아직 퀴즈 기록이 없습니다</p>
            <p className="text-body text-text-sub mb-6">
              첫 퀴즈를 시작해보세요!
            </p>
            <button
              onClick={() => router.push('/practice/quiz')}
              className="px-6 py-3 bg-primary text-white rounded-card text-body font-semibold"
            >
              퀴즈 시작하기
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((item, index) => (
              <motion.div
                key={item.sessionId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-surface rounded-card shadow-soft p-6"
              >
                {/* 날짜 */}
                <div className="text-label text-text-sub mb-3">
                  {formatDate(item.date)}
                </div>

                {/* 점수 및 통계 */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="text-display-s font-bold text-primary">
                      {item.score}점
                    </div>
                    <div className="text-body text-text-sub">
                      {item.correctCount} / {item.totalQuestions}
                    </div>
                  </div>
                  
                  {/* 경험치 */}
                  <div className="text-body font-semibold text-green-600">
                    +{item.expGained} EXP
                  </div>
                </div>

                {/* 상세 정보 */}
                <div className="flex flex-wrap gap-3">
                  {/* 레벨 태그 */}
                  <div className="flex items-center gap-1">
                    {item.levels.map((level) => (
                      <span
                        key={level}
                        className="px-2 py-1 bg-page text-text-sub text-label rounded"
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
  )
}

