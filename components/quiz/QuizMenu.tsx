'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import type { UserQuizLevel, QuizStats } from '@/lib/types/quiz'
import type { JlptLevel } from '@/lib/types/content'
import { getLevelTitle, getLevelProgress } from '@/lib/quiz/expSystem'
import { BookOpen, Clock, Award, BarChart2, Play } from 'lucide-react'

interface QuizMenuProps {
  userLevel: UserQuizLevel
  allStats: Record<JlptLevel, QuizStats>
  onStartQuiz: () => void
}

export function QuizMenu({ userLevel, allStats, onStartQuiz }: QuizMenuProps) {
  const router = useRouter()

  // 전체 통계 계산
  const totalSessions = Object.values(allStats).reduce(
    (sum, stats) => sum + stats.totalSessions,
    0
  )
  const totalQuestions = Object.values(allStats).reduce(
    (sum, stats) => sum + stats.totalQuestions,
    0
  )
  const averageScore = totalSessions > 0
    ? Object.values(allStats).reduce((sum, stats) => sum + stats.averageScore, 0) /
    Object.values(allStats).filter((s) => s.totalSessions > 0).length
    : 0

  const progress = getLevelProgress(userLevel)
  const earnedBadgesCount = userLevel.badges.length

  return (
    <div className="max-w-md mx-auto px-4 py-4 flex flex-col gap-2">
      {/* 레벨 카드 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-surface rounded-lg p-6 shadow-card"
      >
        <div className="flex items-start gap-4 mb-4">
          <div className="relative w-20 sm:w-24 flex-shrink-0">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-200/50 via-pink-200/50 to-purple-200/40 blur-xl" />
            <img
              src="/mask/mogu_magic.png"
              alt="Mogu wizard"
              className="relative w-full h-full object-contain drop-shadow-lg"
              loading="lazy"
            />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-label text-text-sub">Level {userLevel.level}</span>
              <div className="px-2.5 py-1 rounded-full bg-gray-100 text-text-sub text-label font-bold">
                배지 {earnedBadgesCount}개
              </div>
            </div>
            <div className="text-display-s font-black text-text-main mb-3">{getLevelTitle(userLevel.level)}</div>

            {/* 경험치 바 */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-label text-text-sub">
                <span>경험치</span>
                <span className="text-text-main font-medium">
                  {userLevel.exp} / {userLevel.expForNextLevel}
                </span>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress * 100}%` }}
                  transition={{ duration: 0.5, delay: 0.15 }}
                  className="h-full bg-gradient-to-r from-primary/90 to-primary rounded-full"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 통계 정보 (인라인) */}
        {totalSessions > 0 && (
          <div className="flex items-center gap-4 pt-4 pb-4 border-t border-gray-100/50">
            <div className="flex-1 text-center">
              <div className="text-xs text-text-sub mb-1">총 퀴즈</div>
              <div className="text-base font-bold text-text-main">{totalSessions}</div>
            </div>
            <div className="w-px h-10 bg-gray-200" />
            <div className="flex-1 text-center">
              <div className="text-xs text-text-sub mb-1">총 문제</div>
              <div className="text-base font-bold text-text-main">{totalQuestions}</div>
            </div>
            <div className="w-px h-10 bg-gray-200" />
            <div className="flex-1 text-center">
              <div className="text-xs text-text-sub mb-1">평균 점수</div>
              <div className="text-base font-bold text-text-main">
                {averageScore > 0 ? Math.round(averageScore) : 0}점
              </div>
            </div>
          </div>
        )}

        {/* 시작 버튼 */}
        <button
          onClick={onStartQuiz}
          className="w-full py-4 px-4 rounded-lg bg-primary text-white text-body font-bold active:opacity-90 shadow-card flex items-center justify-center gap-2"
        >
          <Play className="w-5 h-5 fill-current" />
          <span>퀴즈 시작</span>
        </button>
      </motion.div>

      {/* 서브 메뉴 - 2x2 그리드 디자인 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 gap-2"
      >
        <button
          onClick={() => router.push('/quiz/notebook')}
          className="flex flex-col items-center justify-center p-5 bg-surface rounded-2xl shadow-soft border border-white/60 active:bg-gray-50 transition-all hover:-translate-y-0.5"
        >
          <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mb-3">
            <BookOpen className="w-6 h-6 text-emerald-600" />
          </div>
          <span className="text-body font-bold text-text-main">
            나만의 단어장
          </span>
        </button>

        <button
          onClick={() => router.push('/quiz/history')}
          className="flex flex-col items-center justify-center p-5 bg-surface rounded-2xl shadow-soft border border-white/60 active:bg-gray-50 transition-all hover:-translate-y-0.5"
        >
          <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mb-3">
            <Clock className="w-6 h-6 text-blue-600" />
          </div>
          <span className="text-body font-bold text-text-main">
            학습 히스토리
          </span>
        </button>

        <button
          onClick={() => router.push('/quiz/badges')}
          className="flex flex-col items-center justify-center p-5 bg-surface rounded-2xl shadow-soft border border-white/60 active:bg-gray-50 transition-all hover:-translate-y-0.5"
        >
          <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mb-3">
            <Award className="w-6 h-6 text-amber-600" />
          </div>
          <span className="text-body font-bold text-text-main">
            배지 보관함
          </span>
        </button>

        <button
          onClick={() => router.push('/quiz/stats')}
          className="flex flex-col items-center justify-center p-5 bg-surface rounded-2xl shadow-soft border border-white/60 active:bg-gray-50 transition-all hover:-translate-y-0.5"
        >
          <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mb-3">
            <BarChart2 className="w-6 h-6 text-purple-600" />
          </div>
          <span className="text-body font-bold text-text-main">
            학습 통계
          </span>
        </button>
      </motion.div>
    </div>
  )
}

