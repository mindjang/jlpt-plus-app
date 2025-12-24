'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import { useMembership } from '@/components/membership/MembershipProvider'
import { getUserData } from '@/lib/firebase/firestore'
import { getReviewCards } from '@/lib/firebase/firestore'
import { getDailyActivity, getStreak } from '@/lib/firebase/firestore/dailyActivity'
import { useUserSettings } from '@/hooks/useUserSettings'
import { logger } from '@/lib/utils/logger'
import { Play, BookOpen, Brain, Zap, ArrowRight, TrendingUp, Calendar, Target, Clock, CheckCircle2, Award } from 'lucide-react'
import { motion } from 'framer-motion'
import { Level } from '@/data'
import type { StreakData, DailyActivity } from '@/lib/types/stats'
import { LEVEL_COLORS, MOGU_BRAND_COLORS } from '@/lib/constants/colors'
import { LoginRequiredScreen } from '@/components/auth/LoginRequiredScreen'
import { BrandLoader } from '@/components/ui/BrandLoader'
import Image from 'next/image'

export default function HomePage() {
  const router = useRouter()
  const { user } = useAuth()
  const { membership, isMember } = useMembership()
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
      // 로그인하지 않은 경우 로딩 완료 처리
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

  // 멤버십 남은 일수 계산
  const getMembershipDaysLeft = (): number | null => {
    if (!membership || !isMember) return null
    const now = Date.now()
    const expiresAt = membership.expiresAt
    if (expiresAt <= now) return null
    const daysLeft = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24))
    return daysLeft
  }

  const membershipDaysLeft = getMembershipDaysLeft()

  const handleStartReview = () => {
    router.push('/practice/learn')
  }

  const handleStartNew = () => {
    router.push(`/acquire/auto-study/${userLevel.toLowerCase()}/word`)
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

  // AuthProvider에서 로딩 중이면 브랜드 로더 표시 (전역 처리)
  // 여기서는 데이터 로딩만 처리

  // 로그인하지 않은 경우 LoginRequiredScreen 표시
  if (!user) {
    return (
      <LoginRequiredScreen
        title="로그인이 필요해요"
        description="학습을 시작하려면<br />로그인이 필요합니다."
        showBackButton={false}
        showBrowseButton={false}
      />
    )
  }

  // 사용자 데이터 로딩 중
  if (loading) {
    return (
      <div className="w-full min-h-screen bg-page">
        <header className="fixed top-0 left-0 right-0 z-30 bg-surface border-b border-divider">
          <div className="flex items-center justify-center h-14 px-4">
            <h1
              className="text-xl font-black"
              style={{
                fontFamily: 'var(--font-mungyeong), MungyeongGamhongApple, Pretendard, -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
                letterSpacing: '-0.02em',
              }}
            >
              MoguJLPT
            </h1>
          </div>
        </header>
        <div className="h-12" />
        <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
          <BrandLoader text="학습 데이터 불러오는 중..." />
        </div>
      </div>
    )
  }

  return (
    <div className="w-full min-h-screen bg-page">
      {/* 맵 헤더 */}
      <header className="fixed top-0 left-0 right-0 z-30 bg-surface border-b border-divider">
        <div className="max-w-lg mx-auto flex items-center justify-start h-12 px-4">
          <h1
            className="text-lg font-black text-primary"
            style={{
              fontFamily: 'var(--font-mungyeong), MungyeongGamhongApple, Pretendard, -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
              letterSpacing: '-0.02em',
            }}
          >
            MoguJLPT
          </h1>
        </div>
      </header>
      <div className="h-12" />

      <main className="p-4 max-w-lg mx-auto flex flex-col gap-2 pb-20">
        {/* 컨텐츠 섹션 */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          {/* 사용자 이름 */}
          <div className='mt-4'>
            <h2>
              <span className="text-primary font-bold pr-0.5">{userName}</span>님
            </h2>

            <p className="text-body">
              {isMember && membershipDaysLeft !== null ? (
                `구독 ${membershipDaysLeft}일 남았어요!`
              ) : streak && streak.currentStreak > 0 ? (
                `${streak.currentStreak}일째 방문 축하드려요!`
              ) : (
                '오늘도 화이팅!'
              )}
            </p>
          </div>

          {/* 주황색 버튼 */}
          {!isMember && <button
            onClick={() => router.push('/acquire/auto-study/n5/word')}
            className="w-full py-4 px-6 rounded-lg text-body font-bold active:opacity-90 flex items-center justify-center gap-2 shadow-card text-white"
            style={{
              backgroundColor: MOGU_BRAND_COLORS.primary,
            }}
          >
            <Play size={20} fill="currentColor" />
            지금 바로 체험하기
          </button>}
        </motion.div>

        {/* Focus Card - The ONE main thing to do (Duolingo Style) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="overflow-hidden"
        >
          {reviewDueCount > 0 ? (
            // Review Mode
            <div className="">
              <div className="text-center mb-5">
                <h2 className="text-2xl font-bold text-text-main mb-3">오늘은 이만큼만 하면 충분해요</h2>
                <p className="text-body text-text-sub mb-1">
                  복습할 카드가 있어요
                </p>
                <p className="text-lg text-text-main font-medium">
                  {Math.min(reviewDueCount, dailyTarget)}개
                </p>
              </div>
              <button
                onClick={handleStartReview}
                className="w-full py-4 px-6 rounded-lg text-body font-bold active:opacity-90 flex items-center justify-center gap-2 shadow-card text-white"
                style={{
                  backgroundColor: MOGU_BRAND_COLORS.primary,
                }}
              >
                <Play size={20} fill="currentColor" />
                지금 시작하기
              </button>
            </div>
          ) : (
            // New Study Mode
            <div className="">
              <div className="mt-2 mb-4">
                <h2 className="text-xl font-bold text-text-main mb-2">새로운 단어를<br />배워볼까요?</h2>
              </div>
              <button
                onClick={handleStartNew}
                className="w-full py-4 px-6 rounded-lg text-body font-bold active:opacity-90 flex items-center justify-center gap-2 shadow-card text-white"
                style={{
                  backgroundColor: LEVEL_COLORS.N5,
                }}
              >
                <BookOpen size={20} fill="currentColor" fillOpacity={0.2} />
                {userLevel} 학습 시작하기
              </button>
            </div>
          )}
        </motion.div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <div className="grid grid-cols-3 gap-2">
            {/* 일일 퀴즈 카드 */}
            <motion.button
              variants={itemVariants}
              onClick={() => router.push('/quiz')}
              className="relative aspect-[3/4] bg-surface rounded-lg p-3 flex flex-col justify-between active:bg-gray-50 overflow-hidden group shadow-soft"
            >
              <span className="text-sm font-semibold text-left">일일<br />퀴즈</span>
              <div className="w-full h-20 flex items-end justify-end">
                <Image
                  src="/mask/mogu_quiz.png"
                  alt="일일 퀴즈 모구"
                  width={60}
                  height={60}
                  className="object-contain"
                  priority
                />
              </div>
            </motion.button>

            {/* 학습 통계 카드 */}
            <motion.button
              variants={itemVariants}
              onClick={() => router.push('/stats')}
              className="relative aspect-[3/4] bg-surface rounded-lg p-3 flex flex-col justify-between active:bg-gray-50 overflow-hidden group shadow-soft"
            >
              <div className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-left">학습<br />통계</span>
              </div>
              <div className="w-full h-20 flex items-end justify-end">
                <Image
                  src="/mask/mogu_stats.png"
                  alt="학습 통계 모구"
                  width={60}
                  height={60}
                  className="object-contain"
                  priority
                />
              </div>
            </motion.button>

            {/* 학습 히스토리 카드 */}
            <motion.button
              variants={itemVariants}
              onClick={() => router.push('/history')}
              className="relative aspect-[3/4] bg-surface rounded-lg p-3 flex flex-col justify-between active:bg-gray-50 overflow-hidden group shadow-soft"
            >
              <div className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-left">학습<br />히스토리</span>
              </div>
              <div className="w-full h-20 flex items-end justify-end">
                <Image
                  src="/mask/mogu_history.png"
                  alt="학습 히스토리 모구"
                  width={60}
                  height={60}
                  className="object-contain"
                  priority
                />

              </div>
            </motion.button>
          </div>
        </motion.div>

        {/* 오늘의 학습 요약 - Duolingo Style */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-surface rounded-lg p-4 shadow-soft"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-body font-semibold text-text-main">오늘의 학습</h3>
            <button
              onClick={() => router.push('/stats')}
              className="text-label text-text-sub active:opacity-70 font-medium underline"
            >
              자세히 보기
            </button>
          </div>

          {/* 일일 목표 진행도 */}
          <div className="space-y-1.5 mb-3">
            <div className="flex items-center justify-between">
              <span className="text-body text-text-sub">오늘 목표 진행 중</span>
              <span className="text-body font-medium text-text-main">
                {Math.round(todayProgress)}%
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${todayProgress}%` }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="h-full rounded-full"
                style={{
                  backgroundColor: MOGU_BRAND_COLORS.primary,
                }}
              />
            </div>
            <p className="text-label text-text-sub text-center mt-1">
              {todayLearned} / {dailyTarget} 완료
            </p>
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
      </main>
    </div>
  )
}
