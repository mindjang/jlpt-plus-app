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
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* 레벨 카드 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-primary to-blue-600 rounded-lg p-6 text-white"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-label opacity-90 mb-1">현재 레벨</div>
            <div className="text-display-m font-bold">Level {userLevel.level}</div>
            <div className="text-body opacity-90">{getLevelTitle(userLevel.level)}</div>
          </div>
          <div className="text-right">
            <div className="text-display-s font-bold">{earnedBadgesCount}</div>
            <div className="text-label opacity-90">획득 배지</div>
          </div>
        </div>

        {/* 경험치 바 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-label">
            <span>경험치</span>
            <span>
              {userLevel.exp} / {userLevel.expForNextLevel}
            </span>
          </div>
          <div className="h-3 bg-white bg-opacity-20 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="h-full bg-white rounded-full"
            />
          </div>
        </div>
      </motion.div>

      {/* 통계 카드 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-3 gap-4"
      >
        <div className="bg-surface rounded-lg border border-divider p-4 text-center">
          <div className="text-display-s font-bold text-primary mb-1">
            {totalSessions}
          </div>
          <div className="text-label text-text-sub">총 퀴즈</div>
        </div>
        <div className="bg-surface rounded-lg border border-divider p-4 text-center">
          <div className="text-display-s font-bold text-green-600 mb-1">
            {totalQuestions}
          </div>
          <div className="text-label text-text-sub">총 문제</div>
        </div>
        <div className="bg-surface rounded-lg border border-divider p-4 text-center">
          <div className="text-display-s font-bold text-yellow-600 mb-1">
            {averageScore > 0 ? Math.round(averageScore) : 0}
          </div>
          <div className="text-label text-text-sub">평균 점수</div>
        </div>
      </motion.div>

      {/* 메뉴 버튼 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-3"
      >
        {/* 퀴즈 시작 - 메인 버튼 */}
        <button
          onClick={onStartQuiz}
          className="w-full py-4 px-6 bg-primary text-white rounded-lg active:opacity-80 flex items-center justify-center gap-3"
        >
          <FontAwesomeIcon
            icon={faPlay}
            className="text-2xl"
          />
          <span className="text-body font-semibold">퀴즈 시작하기</span>
        </button>

        {/* 서브 메뉴 */}
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => router.push('/quiz/history')}
            className="py-3 px-4 bg-surface border border-divider rounded-lg active:bg-gray-50 flex flex-col items-center justify-center gap-2"
          >
            <FontAwesomeIcon icon={faHistory} className="text-xl text-primary" />
            <span className="text-label font-medium text-text-main">히스토리</span>
          </button>

          <button
            onClick={() => router.push('/quiz/badges')}
            className="py-3 px-4 bg-surface border border-divider rounded-lg active:bg-gray-50 flex flex-col items-center justify-center gap-2"
          >
            <FontAwesomeIcon icon={faTrophy} className="text-xl text-yellow-600" />
            <span className="text-label font-medium text-text-main">배지</span>
          </button>

          <button
            onClick={() => router.push('/quiz/stats')}
            className="py-3 px-4 bg-surface border border-divider rounded-lg active:bg-gray-50 flex flex-col items-center justify-center gap-2"
          >
            <FontAwesomeIcon icon={faChartLine} className="text-xl text-green-600" />
            <span className="text-label font-medium text-text-main">통계</span>
          </button>
        </div>
      </motion.div>

      {/* 최근 성과 (선택적) */}
      {totalSessions > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-surface rounded-lg border border-divider p-6"
        >
          <h3 className="text-body font-semibold text-text-main mb-4">레벨별 진행도</h3>
          <div className="space-y-3">
            {(['N5', 'N4', 'N3', 'N2', 'N1'] as JlptLevel[]).map((level) => {
              const stats = allStats[level]
              const accuracy = stats.averageAccuracy * 100

              return (
                <div key={level} className="space-y-1">
                  <div className="flex items-center justify-between text-label">
                    <span className="font-medium text-text-main">{level}</span>
                    <span className="text-text-sub">
                      {stats.totalQuestions > 0
                        ? `${Math.round(accuracy)}% (${stats.totalQuestions}문제)`
                        : '미학습'}
                    </span>
                  </div>
                  {stats.totalQuestions > 0 && (
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          accuracy >= 80
                            ? 'bg-green-500'
                            : accuracy >= 60
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${accuracy}%` }}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </motion.div>
      )}
    </div>
  )
}

