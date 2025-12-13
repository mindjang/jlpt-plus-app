'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import { AppBar } from '@/components/ui/AppBar'
import { StreakChip } from '@/components/ui/StreakChip'
import { getUserData } from '@/lib/firebase/firestore'
import { getReviewCards } from '@/lib/firebase/firestore'
import { logger } from '@/lib/utils/logger'
import { Play, BookOpen, Brain, Zap, ArrowRight, TrendingUp } from 'lucide-react'
import { motion } from 'framer-motion'
import { Level } from '@/data'

export default function HomePage() {
  const router = useRouter()
  const { user } = useAuth()
  const [reviewDueCount, setReviewDueCount] = useState(0)
  const [userLevel, setUserLevel] = useState<string>('N5')
  const [userName, setUserName] = useState<string>('Guest')
  const [loading, setLoading] = useState(true)

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
      const userData = await getUserData(user.uid)
      // Default to N5 if targetLevel is not set
      if (userData?.profile.targetLevel) {
        setUserLevel(userData.profile.targetLevel)
      }

      const reviewCards = await getReviewCards(user.uid, 500)
      setReviewDueCount(reviewCards.length)
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
    router.push('/practice')
  }

  const handleStartNew = () => {
    router.push(`/acquire/auto-study/${userLevel.toLowerCase()}`)
  }

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

      <main className="p-5 max-w-md mx-auto space-y-8">
        {/* Header Section */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="flex items-start justify-between"
        >
          <div>
            <motion.p variants={itemVariants} className="text-text-sub text-sm font-medium">{getGreeting()}</motion.p>
            <motion.h1 variants={itemVariants} className="text-3xl font-bold text-text-main mt-1">
              {userName}님.
            </motion.h1>
          </div>
          <motion.div variants={itemVariants}>
            <StreakChip count={0} />
          </motion.div>
        </motion.div>

        {/* Focus Card - The ONE main thing to do */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="relative overflow-hidden rounded-[2rem] shadow-xl"
        >
          {reviewDueCount > 0 ? (
            // Review Mode
            <div className="bg-gradient-to-br from-orange-400 to-red-500 p-8 text-white relative">
              <div className="absolute top-0 right-0 p-8 opacity-20">
                <Brain size={120} />
              </div>
              <div className="relative z-10">
                <div className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold mb-4 border border-white/30">
                  우선순위
                </div>
                <h2 className="text-3xl font-bold mb-2">복습 필요</h2>
                <p className="opacity-90 mb-8 max-w-[70%]">
                  현재 <strong className="text-xl mx-1 border-b-2 border-white">{reviewDueCount}</strong> 개의 카드가 복습을 기다리고 있습니다.
                </p>
                <button
                  onClick={handleStartReview}
                  className="w-full py-4 bg-white text-orange-600 rounded-lg font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2 group"
                >
                  <Play size={20} fill="currentColor" />
                  복습 시작하기
                </button>
              </div>
            </div>
          ) : (
            // New Study Mode
            <div className="bg-gradient-to-br from-blue-500 to-cyan-400 p-8 text-white relative">
              <div className="absolute top-0 right-0 p-8 opacity-20">
                <Zap size={120} />
              </div>
              <div className="relative z-10">
                <div className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold mb-4 border border-white/30">
                  {userLevel} 목표
                </div>
                <h2 className="text-3xl font-bold mb-2">새로운 학습</h2>
                <p className="opacity-90 mb-8 max-w-[70%]">
                  복습이 완료되었습니다! 새로운 내용을 배워볼까요?
                </p>
                <button
                  onClick={handleStartNew}
                  className="w-full py-4 bg-white text-blue-600 rounded-lg font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                >
                  <BookOpen size={20} />
                  {userLevel} 학습 시작
                </button>
              </div>
            </div>
          )}
        </motion.div>

        {/* Quick Actions / Resume */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="space-y-4"
        >
          <div className="flex items-center justify-between px-1">
            <h3 className="text-lg font-bold text-text-main">빠른 실행</h3>
            <span className="text-xs text-text-sub bg-surface px-2 py-1 rounded-full border border-divider">
              목표: {userLevel}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => router.push(`/acquire/auto-study/${userLevel.toLowerCase()}`)}
              className="p-5 bg-surface rounded-lg shadow-soft hover:shadow-md transition-all text-left group border border-divider"
            >
              <div className="p-3 bg-blue-50 text-blue-500 rounded-lg w-fit mb-3 group-hover:bg-blue-100 transition-colors">
                <BookOpen size={24} />
              </div>
              <h4 className="font-bold text-text-main text-lg">단어/한자</h4>
              <p className="text-text-sub text-xs mt-1">나의 레벨 학습</p>
            </button>

            <button
              onClick={() => router.push('/practice/quiz')}
              className="p-5 bg-surface rounded-lg shadow-soft hover:shadow-md transition-all text-left group border border-divider"
            >
              <div className="p-3 bg-purple-50 text-purple-500 rounded-lg w-fit mb-3 group-hover:bg-purple-100 transition-colors">
                <Brain size={24} />
              </div>
              <h4 className="font-bold text-text-main text-lg">일일 퀴즈</h4>
              <p className="text-text-sub text-xs mt-1">실력 테스트</p>
            </button>

            <button
              onClick={() => router.push('/stats')}
              className="col-span-2 p-5 bg-surface rounded-lg shadow-soft hover:shadow-md transition-all flex items-center justify-between group border border-divider"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-50 text-green-500 rounded-lg group-hover:bg-green-100 transition-colors">
                  <TrendingUp size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-text-main">학습 통계</h4>
                  <p className="text-text-sub text-xs">나의 학습 현황 확인하기</p>
                </div>
              </div>
              <ArrowRight size={20} className="text-divider group-hover:text-primary transition-colors" />
            </button>
          </div>
        </motion.div>

        {/* Footer Message */}
        <div className="text-center pt-8 opacity-40">
          <p className="text-xs font-mono">JLPT ONE</p>
        </div>

      </main>
    </div>
  )
}

