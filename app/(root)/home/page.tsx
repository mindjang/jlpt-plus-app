'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import { AppBar } from '@/components/ui/AppBar'
import { StreakChip } from '@/components/ui/StreakChip'
import { getUserData } from '@/lib/firebase/firestore'
import { getReviewCards } from '@/lib/firebase/firestore'
import { getDailyActivity, getStreak } from '@/lib/firebase/firestore/dailyActivity'
import { useUserSettings } from '@/hooks/useUserSettings'
import { logger } from '@/lib/utils/logger'
import { Play, BookOpen, Brain, Zap, ArrowRight, TrendingUp, Calendar, Target, Clock, CheckCircle2, Award } from 'lucide-react'
import { motion } from 'framer-motion'
import { Level } from '@/data'
import type { StreakData, DailyActivity } from '@/lib/types/stats'

export default function HomePage() {
  const router = useRouter()
  const { user } = useAuth()
  const { settings } = useUserSettings(user)
  const [reviewDueCount, setReviewDueCount] = useState(0)
  const [userLevel, setUserLevel] = useState<string>('N5')
  const [userName, setUserName] = useState<string>('Guest')
  const [loading, setLoading] = useState(true)
  const [streak, setStreak] = useState<StreakData | null>(null)
  const [todayActivity, setTodayActivity] = useState<DailyActivity | null>(null)

  useEffect(() => {
    if (user) {
      setUserName(user.displayName || 'Learner')
      loadUserData()
    } else {
      setLoading(false)
    }
  }, [user])

  const loadUserData = async () => {
    if (!user) return
    try {
      // 병렬로 데이터 로드
      const [userData, reviewCards, streakData, activityData] = await Promise.all([
        getUserData(user.uid),
        getReviewCards(user.uid, 500),
        getStreak(user.uid),
        getDailyActivity(user.uid),
      ])

      // Default to N5 if targetLevel is not set
      if (userData?.profile.targetLevel) {
        setUserLevel(userData.profile.targetLevel)
      }

      setReviewDueCount(reviewCards.length)
      setStreak(streakData)
      setTodayActivity(activityData)
    } catch (error) {
      logger.error('Failed to load user data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return '좋은 아침입니다,'
    if (hour < 18) return '안녕하세요,'
    return '좋은 저녁입니다,'
  }

  const handleStartReview = () => {
    router.push('/practice/learn')
  }

  const handleStartNew = () => {
    router.push(`/acquire/auto-study/${userLevel.toLowerCase()}`)
  }

  const formatTime = (ms: number | undefined): string => {
    if (!ms) return '0분'
    const minutes = Math.floor(ms / 60000)
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60

    if (hours > 0) {
      return `${hours}시간 ${remainingMinutes}분`
    }
    return `${minutes}분`
  }

  // 오늘의 학습 목표 진행도 계산
  const dailyTarget = settings?.dailyNewLimit || 20
  const todayLearned = todayActivity?.contentBreakdown.word.questions || 0
  const todayProgress = Math.min((todayLearned / dailyTarget) * 100, 100)
  const todayCorrect = (todayActivity?.contentBreakdown.word.correct || 0) + (todayActivity?.contentBreakdown.kanji.correct || 0)
  const todayTotal = todayActivity?.totalQuestions || 0
  const todayAccuracy = todayTotal > 0 ? Math.round((todayCorrect / todayTotal) * 100) : 0

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  }

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-page">
        <div className="animate-pulse text-primary font-bold">로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="w-full min-h-screen bg-page">
      <main className="p-4 max-w-md mx-auto space-y-4 pb-20">
        {/* Header Section */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="flex items-start justify-between"
        >
          <div>
            <motion.p variants={itemVariants} className="text-text-sub text-label font-medium">{getGreeting()}</motion.p>
            <motion.h1 variants={itemVariants} className="text-title font-bold text-text-main mt-0.5">
              {user ? `${userName}님.` : '환영합니다!'}
            </motion.h1>
          </div>
          {user && (
            <motion.div variants={itemVariants}>
              <StreakChip count={streak?.currentStreak || 0} />
            </motion.div>
          )}
        </motion.div>

        {/* Focus Card - The ONE main thing to do (Duolingo Style) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-surface rounded-lg border border-divider overflow-hidden"
        >
          {!user ? (
            // Guest Mode: Try Now
            <div className="p-5">
              <div className="text-center mb-4">
                <h2 className="text-title font-bold text-text-main mb-2">3분 맛보기</h2>
                <p className="text-body text-text-sub">
                  로그인 없이 바로 학습을 시작해보세요
                </p>
              </div>
              <button
                onClick={() => router.push('/acquire/auto-study/n5?taste=true')}
                className="w-full py-4 px-6 bg-primary text-white rounded-lg text-body font-bold active:opacity-90 flex items-center justify-center gap-2 shadow-sm"
              >
                <Play size={20} fill="currentColor" />
                지금 바로 체험하기
              </button>
            </div>
          ) : reviewDueCount > 0 ? (
            // Review Mode
            <div className="p-5">
              <div className="text-center mb-4">
                <h2 className="text-title font-bold text-text-main mb-2">복습 필요</h2>
                <p className="text-body text-text-sub">
                  <strong className="text-title font-bold text-primary">{reviewDueCount}</strong> 개의 카드가 복습을 기다리고 있습니다
                </p>
              </div>
              <button
                onClick={handleStartReview}
                className="w-full py-4 px-6 bg-primary text-white rounded-lg text-body font-bold active:opacity-90 flex items-center justify-center gap-2 shadow-sm"
              >
                <Play size={20} fill="currentColor" />
                복습 시작하기
              </button>
            </div>
          ) : (
            // New Study Mode
            <div className="p-5">
              <div className="text-center mb-4">
                <h2 className="text-title font-bold text-text-main mb-2">새로운 학습</h2>
                <p className="text-body text-text-sub">
                  {userLevel} 레벨 학습을 시작해보세요
                </p>
              </div>
              <button
                onClick={handleStartNew}
                className="w-full py-4 px-6 bg-primary text-white rounded-lg text-body font-bold active:opacity-90 flex items-center justify-center gap-2 shadow-sm"
              >
                <BookOpen size={20} />
                {userLevel} 학습 시작
              </button>
            </div>
          )}
        </motion.div>

        {/* 오늘의 학습 요약 (로그인 사용자만) - Duolingo Style */}
        {user && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-surface rounded-lg border border-divider p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-body font-semibold text-text-main">오늘의 학습</h3>
              <button
                onClick={() => router.push('/stats')}
                className="text-label text-primary active:opacity-70 font-medium"
              >
                자세히 보기 →
              </button>
            </div>

            {/* 일일 목표 진행도 - Duolingo Style */}
            <div className="space-y-1.5 mb-3">
              <div className="flex items-center justify-between">
                <span className="text-body text-text-sub">일일 목표</span>
                <span className="text-body font-semibold text-text-main">
                  {todayLearned} / {dailyTarget}
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${todayProgress}%` }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="h-full bg-primary rounded-full"
                />
              </div>
            </div>

            {/* 오늘의 통계 (리스트 형태) - Duolingo Style */}
            <div className="space-y-2">
              <div className="flex items-center justify-between py-1.5">
                <span className="text-body text-text-sub">학습 문제</span>
                <span className="text-body font-semibold text-text-main">{todayTotal}</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-body text-text-sub">정답률</span>
                <span className="text-body font-semibold text-text-main">{todayAccuracy}%</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-body text-text-sub">학습 시간</span>
                <span className="text-body font-semibold text-text-main">{formatTime(todayActivity?.totalTime)}</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Quick Actions / Resume - Duolingo Style */}
        {user && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="space-y-2"
          >
            <div className="flex items-center justify-between px-1">
              <h3 className="text-label font-semibold text-text-sub uppercase tracking-wide">더 보기</h3>
            </div>

            <div className="space-y-1">
              <button
                onClick={() => router.push('/quiz')}
                className="w-full p-3 bg-surface rounded-lg flex items-center justify-between border border-divider active:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Brain size={16} className="text-text-main" />
                  </div>
                  <span className="text-body font-medium text-text-main">일일 퀴즈</span>
                </div>
                <ArrowRight size={16} className="text-text-sub flex-shrink-0" />
              </button>

              <button
                onClick={() => router.push('/stats')}
                className="w-full p-3 bg-surface rounded-lg flex items-center justify-between border border-divider active:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <TrendingUp size={16} className="text-text-main" />
                  </div>
                  <span className="text-body font-medium text-text-main">학습 통계</span>
                </div>
                <ArrowRight size={16} className="text-text-sub flex-shrink-0" />
              </button>

              <button
                onClick={() => router.push('/history')}
                className="w-full p-3 bg-surface rounded-lg flex items-center justify-between border border-divider active:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Calendar size={16} className="text-text-main" />
                  </div>
                  <span className="text-body font-medium text-text-main">학습 히스토리</span>
                </div>
                <ArrowRight size={16} className="text-text-sub flex-shrink-0" />
              </button>
            </div>
          </motion.div>
        )}

        {/* Footer Message */}
        <div className="text-center pt-4 opacity-40">
          <p className="text-xs font-mono">JLPT ONE</p>
        </div>

      </main>
    </div>
  )
}
