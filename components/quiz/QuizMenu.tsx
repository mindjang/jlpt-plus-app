'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import type { UserQuizLevel, QuizStats } from '@/lib/types/quiz'
import type { JlptLevel } from '@/lib/types/content'
import { getLevelTitle, getLevelProgress } from '@/lib/quiz/expSystem'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlay, faHistory, faTrophy, faChartLine } from '@fortawesome/free-solid-svg-icons'

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
    <div className="max-w-md mx-auto px-4 py-4 space-y-4">
      {/* 레벨 카드 - Duolingo Style */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-primary to-blue-600 rounded-lg p-5 text-white text-center"
      >
        <div className="mb-3">
          <div className="text-label opacity-90 mb-1">Level {userLevel.level}</div>
          <div className="text-title font-bold mb-1">{getLevelTitle(userLevel.level)}</div>
          <div className="text-body opacity-90">{earnedBadgesCount}개 배지 획득</div>
        </div>

        {/* 경험치 바 */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-label">
            <span>경험치</span>
            <span>
              {userLevel.exp} / {userLevel.expForNextLevel}
            </span>
          </div>
          <div className="h-2 bg-white bg-opacity-20 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="h-full bg-white rounded-full"
            />
          </div>
        </div>
      </motion.div>

      {/* 메인 CTA 버튼 - Duolingo Style */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <button
          onClick={onStartQuiz}
          className="w-full py-4 px-6 bg-primary text-white rounded-lg text-body font-bold active:opacity-90 flex items-center justify-center gap-2 shadow-sm"
        >
          <FontAwesomeIcon
            icon={faPlay}
            className="text-lg"
          />
          <span>퀴즈 시작하기</span>
        </button>
      </motion.div>

      {/* 통계 (간단한 리스트) - Duolingo Style */}
      {totalSessions > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-surface rounded-lg border border-divider p-4"
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-body text-text-sub">총 퀴즈</span>
              <span className="text-body font-semibold text-text-main">{totalSessions}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-body text-text-sub">총 문제</span>
              <span className="text-body font-semibold text-text-main">{totalQuestions}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-body text-text-sub">평균 점수</span>
              <span className="text-body font-semibold text-text-main">
                {averageScore > 0 ? Math.round(averageScore) : 0}점
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* 서브 메뉴 - Duolingo Style */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-1"
      >
        <div className="px-1 mb-1">
          <h3 className="text-label font-semibold text-text-sub uppercase tracking-wide">더 보기</h3>
        </div>
        <button
          onClick={() => router.push('/quiz/history')}
          className="w-full p-3 bg-surface rounded-lg flex items-center justify-between border border-divider active:bg-gray-50"
        >
          <div className="flex items-center gap-3">
            <FontAwesomeIcon icon={faHistory} className="text-lg text-text-main" />
            <span className="text-body font-medium text-text-main">히스토리</span>
          </div>
        </button>

        <button
          onClick={() => router.push('/quiz/badges')}
          className="w-full p-3 bg-surface rounded-lg flex items-center justify-between border border-divider active:bg-gray-50"
        >
          <div className="flex items-center gap-3">
            <FontAwesomeIcon icon={faTrophy} className="text-lg text-text-main" />
            <span className="text-body font-medium text-text-main">배지</span>
          </div>
        </button>

        <button
          onClick={() => router.push('/quiz/stats')}
          className="w-full p-3 bg-surface rounded-lg flex items-center justify-between border border-divider active:bg-gray-50"
        >
          <div className="flex items-center gap-3">
            <FontAwesomeIcon icon={faChartLine} className="text-lg text-text-main" />
            <span className="text-body font-medium text-text-main">통계</span>
          </div>
        </button>
      </motion.div>
    </div>
  )
}

