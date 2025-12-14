'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import { AppBar } from '@/components/ui/AppBar'
import { LoginRequiredScreen } from '@/components/auth/LoginRequiredScreen'
import { getRangeActivity } from '@/lib/firebase/firestore/dailyActivity'
import type { DailyActivity } from '@/lib/types/stats'
import { Calendar, Clock, CheckCircle2, BookOpen, Target, TrendingUp, ArrowLeft, ArrowRight } from 'lucide-react'
import { formatDateKey } from '@/lib/firebase/firestore/utils'

function HistoryContent() {
  const router = useRouter()
  const { user } = useAuth()
  const [activities, setActivities] = useState<Record<string, DailyActivity>>({})
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<'7' | '30' | '90'>('30')
  const [currentPage, setCurrentPage] = useState(0)

  useEffect(() => {
    if (user) {
      loadHistory()
    }
  }, [user, dateRange])

  const loadHistory = async () => {
    if (!user) return
    try {
      setLoading(true)
      const days = parseInt(dateRange)
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      const startDateKey = formatDateKey(startDate)
      const endDateKey = formatDateKey(endDate)

      const data = await getRangeActivity(user.uid, startDateKey, endDateKey)
      setActivities(data)
    } catch (error) {
      console.error('학습 히스토리 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  // 날짜별로 정렬된 활동 목록
  const sortedActivities = Object.entries(activities)
    .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
    .slice(currentPage * 10, (currentPage + 1) * 10)

  const totalPages = Math.ceil(Object.keys(activities).length / 10)

  const formatDate = (dateKey: string) => {
    const year = dateKey.substring(0, 4)
    const month = dateKey.substring(4, 6)
    const day = dateKey.substring(6, 8)
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (dateKey === formatDateKey(today)) return '오늘'
    if (dateKey === formatDateKey(yesterday)) return '어제'

    return `${year}.${month}.${day}`
  }

  const calculateAccuracy = (activity: DailyActivity) => {
    if (activity.totalQuestions === 0) return 0
    const totalCorrect =
      activity.contentBreakdown.word.correct + activity.contentBreakdown.kanji.correct
    return Math.round((totalCorrect / activity.totalQuestions) * 100)
  }

  if (!user) {
    return (
      <LoginRequiredScreen
        title="학습 히스토리"
        showBackButton
        onBack={() => router.back()}
        description="학습 히스토리를 확인하려면<br />로그인이 필요합니다."
      />
    )
  }

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-page">
        <AppBar title="학습 히스토리" onBack={() => router.back()} />
        <div className="flex items-center justify-center min-h-[calc(100vh-56px)]">
          <div className="text-body text-text-sub">로딩 중...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full min-h-screen bg-page">
      <AppBar title="학습 히스토리" onBack={() => router.back()} />

      <div className="p-4 pb-20 space-y-4">
        {/* 날짜 범위 선택 */}
        <div className="bg-surface rounded-lg border border-divider p-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-text-sub" />
              <span className="text-body font-semibold text-text-main">기간 선택</span>
            </div>
            <div className="flex gap-2">
              {(['7', '30', '90'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => {
                    setDateRange(range)
                    setCurrentPage(0)
                  }}
                  className={`px-4 py-2 rounded-lg text-body font-medium transition-colors ${
                    dateRange === range
                      ? 'bg-primary text-white'
                      : 'bg-page text-text-main hover:bg-gray-100'
                  }`}
                >
                  최근 {range}일
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 통계 요약 */}
        {Object.keys(activities).length > 0 && (
          <div className="bg-surface rounded-lg border border-divider p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-label text-text-sub mb-1">총 학습일</div>
                <div className="text-title font-bold text-text-main">
                  {Object.keys(activities).length}일
                </div>
              </div>
              <div>
                <div className="text-label text-text-sub mb-1">총 학습 카드</div>
                <div className="text-title font-bold text-text-main">
                  {Object.values(activities).reduce((sum, a) => sum + a.totalQuestions, 0).toLocaleString()}개
                </div>
              </div>
              <div>
                <div className="text-label text-text-sub mb-1">평균 정답률</div>
                <div className="text-title font-bold text-text-main">
                  {Object.values(activities).length > 0
                    ? Math.round(
                        Object.values(activities).reduce(
                          (sum, a) => sum + calculateAccuracy(a),
                          0
                        ) / Object.values(activities).length
                      )
                    : 0}
                    %
                </div>
              </div>
              <div>
                <div className="text-label text-text-sub mb-1">총 학습 시간</div>
                <div className="text-title font-bold text-text-main">
                  {Math.round(
                    Object.values(activities).reduce((sum, a) => sum + a.totalTime, 0) / 60000
                  ).toLocaleString()}분
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 학습 기록 목록 */}
        {sortedActivities.length === 0 ? (
          <div className="bg-surface rounded-lg border border-divider p-8 text-center">
            <div className="text-body text-text-sub">
              {dateRange === '7'
                ? '최근 7일간 학습 기록이 없습니다.'
                : dateRange === '30'
                ? '최근 30일간 학습 기록이 없습니다.'
                : '최근 90일간 학습 기록이 없습니다.'}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedActivities.map(([dateKey, activity]) => (
              <div
                key={dateKey}
                className="bg-surface rounded-lg border border-divider p-4 hover:border-primary transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-text-sub" />
                    <span className="text-body font-semibold text-text-main">{formatDate(dateKey)}</span>
                  </div>
                  <div className="text-label text-text-sub">
                    {activity.sessions}회 세션
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-xs text-text-sub">학습 카드</div>
                      <div className="text-body font-semibold text-text-main">
                        {activity.totalQuestions}개
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                      <Target className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <div className="text-xs text-text-sub">정답률</div>
                      <div className="text-body font-semibold text-text-main">
                        {calculateAccuracy(activity)}%
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                      <Clock className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <div className="text-xs text-text-sub">학습 시간</div>
                      <div className="text-body font-semibold text-text-main">
                        {Math.round(activity.totalTime / 60000)}분
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-4 h-4 text-orange-600" />
                    </div>
                    <div>
                      <div className="text-xs text-text-sub">단어/한자</div>
                      <div className="text-body font-semibold text-text-main">
                        {activity.contentBreakdown.word.questions + activity.contentBreakdown.kanji.questions}개
                      </div>
                    </div>
                  </div>
                </div>

                {/* 상세 정보 */}
                <div className="mt-3 pt-3 border-t border-divider">
                  <div className="flex items-center gap-4 text-xs text-text-sub">
                    <span>
                      예문 학습: {activity.modeBreakdown.exampleStudy.questions}개
                    </span>
                    <span>
                      퀴즈: {activity.modeBreakdown.quiz.questions}개
                    </span>
                    {activity.modeBreakdown.game.questions > 0 && (
                      <span>
                        게임: {activity.modeBreakdown.game.questions}개
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <button
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              className="p-2 rounded-lg border border-divider disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <ArrowLeft size={18} />
            </button>
            <span className="text-body text-text-sub">
              {currentPage + 1} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage >= totalPages - 1}
              className="p-2 rounded-lg border border-divider disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <ArrowRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function HistoryPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-body text-text-sub">로딩 중...</div>
        </div>
      }
    >
      <HistoryContent />
    </Suspense>
  )
}
