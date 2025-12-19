'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { getDailyActivity, getStreak } from '@/lib/firebase/firestore/dailyActivity'
import { getCachedStats, setCachedStats, getTodayKey, getStreakKey } from '@/lib/cache/statsCache'
import type { DailyActivity, StreakData } from '@/lib/types/stats'
import { motion } from 'framer-motion'
import { BookOpen, Clock, Flame, CheckCircle2, Book, PenTool, Gamepad2 } from 'lucide-react'

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string | number | undefined
  iconBg?: string
}

function StatCard({ icon, label, value, iconBg = 'bg-gray-100' }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-surface rounded-lg border border-divider p-3"
    >
      <div className="flex items-center gap-2.5">
        <div className={`w-9 h-9 rounded-lg ${iconBg} flex items-center justify-center flex-shrink-0`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-label text-text-sub mb-0.5">{label}</div>
          <div className="text-body font-bold text-text-main">
            {value !== undefined ? value : '-'}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function formatTime(ms: number | undefined): string {
  if (!ms) return '0분'
  const minutes = Math.floor(ms / 60000)
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  if (hours > 0) {
    return `${hours}시간 ${remainingMinutes}분`
  }
  return `${minutes}분`
}

export function TodayOverview() {
  const { user } = useAuth()
  const [todayData, setTodayData] = useState<DailyActivity | null>(null)
  const [streak, setStreak] = useState<StreakData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    loadData()
  }, [user])

  const loadData = async () => {
    if (!user) return

    setLoading(true)
    try {
      // 캐시 확인
      const todayCacheKey = getTodayKey(user.uid)
      const streakCacheKey = getStreakKey(user.uid)

      let todayCached = getCachedStats(todayCacheKey, 5 * 60 * 1000) // 5분 TTL
      let streakCached = getCachedStats(streakCacheKey, 5 * 60 * 1000)

      if (!todayCached) {
        const data = await getDailyActivity(user.uid)
        todayCached = data
        if (data) {
          setCachedStats(todayCacheKey, data)
        }
      }

      if (!streakCached) {
        const data = await getStreak(user.uid)
        streakCached = data
        if (data) {
          setCachedStats(streakCacheKey, data)
        }
      }

      setTodayData(todayCached)
      setStreak(streakCached)
    } catch (error) {
      console.error('[TodayOverview] Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-surface rounded-lg border border-divider p-4 h-24 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  const totalCorrect =
    (todayData?.contentBreakdown.word.correct || 0) +
    (todayData?.contentBreakdown.kanji.correct || 0)
  const accuracy = todayData?.totalQuestions
    ? Math.round((totalCorrect / todayData.totalQuestions) * 100)
    : 0

  return (
    <div className="space-y-3">
      {/* 제목 */}
      <div className="flex items-center justify-between">
        <h2 className="text-body font-semibold text-text-main">오늘의 학습 정보</h2>
        <button
          onClick={loadData}
          className="text-label text-primary active:opacity-70"
        >
          새로고침
        </button>
      </div>

      {/* 주요 지표 카드 */}
      <div className="grid grid-cols-2 gap-2.5">
        <StatCard
          icon={<BookOpen size={18} className="text-text-main" />}
          label="총 학습 문제"
          value={todayData?.totalQuestions || 0}
          iconBg="bg-blue-100"
        />
        <StatCard
          icon={<Clock size={18} className="text-text-main" />}
          label="총 학습 시간"
          value={formatTime(todayData?.totalTime)}
          iconBg="bg-purple-100"
        />
        <StatCard
          icon={<Flame size={18} className="text-orange-600" />}
          label="연속 학습"
          value={streak ? `${streak.currentStreak}일` : '0일'}
          iconBg="bg-orange-100"
        />
        <StatCard
          icon={<CheckCircle2 size={18} className="text-green-600" />}
          label="정답률"
          value={`${accuracy}%`}
          iconBg="bg-green-100"
        />
      </div>

      {/* 카테고리별 학습 현황 */}
      {todayData && todayData.totalQuestions > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-surface rounded-lg border border-divider p-4"
        >
          <h3 className="text-body font-semibold text-text-main mb-2.5">모드별 학습</h3>
          <div className="space-y-2">
            {todayData.modeBreakdown.exampleStudy.questions > 0 && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Book size={14} className="text-blue-600" />
                  </div>
                  <span className="text-body text-text-sub">예문 학습</span>
                </div>
                <span className="text-body font-medium text-text-main">
                  {todayData.modeBreakdown.exampleStudy.questions}문제
                </span>
              </div>
            )}
            {todayData.modeBreakdown.quiz.questions > 0 && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-purple-100 flex items-center justify-center">
                    <PenTool size={14} className="text-purple-600" />
                  </div>
                  <span className="text-body text-text-sub">퀴즈</span>
                </div>
                <span className="text-body font-medium text-text-main">
                  {todayData.modeBreakdown.quiz.questions}문제
                </span>
              </div>
            )}
            {todayData.modeBreakdown.game.questions > 0 && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-orange-100 flex items-center justify-center">
                    <Gamepad2 size={14} className="text-orange-600" />
                  </div>
                  <span className="text-body text-text-sub">게임</span>
                </div>
                <span className="text-body font-medium text-text-main">
                  {todayData.modeBreakdown.game.questions}문제
                </span>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* 데이터 없을 때 */}
      {!todayData || todayData.totalQuestions === 0 && (
        <div className="bg-surface rounded-lg border border-divider p-6 text-center">
          <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <Book size={24} className="text-text-sub" />
          </div>
          <div className="text-body text-text-sub">
            오늘은 아직 학습 기록이 없습니다
          </div>
        </div>
      )}
    </div>
  )
}

