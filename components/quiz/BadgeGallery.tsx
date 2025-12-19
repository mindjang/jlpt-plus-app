'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { ALL_BADGES, getBadgeById, calculateBadgeProgress } from '@/lib/quiz/badgeSystem'
import type { UserQuizLevel } from '@/lib/types/quiz'
import type { JlptLevel } from '@/lib/types/content'

interface BadgeGalleryProps {
  userLevel: UserQuizLevel
  totalSessionsCompleted: number
  totalQuestionsAnswered: number
  consecutiveDays: number
  levelStats: Record<JlptLevel, { correct: number; total: number; accuracy: number }>
}

export function BadgeGallery({
  userLevel,
  totalSessionsCompleted,
  totalQuestionsAnswered,
  consecutiveDays,
  levelStats,
}: BadgeGalleryProps) {
  const earnedBadges = userLevel.badges
  const context = {
    userLevel,
    totalSessionsCompleted,
    totalQuestionsAnswered,
    consecutiveDays,
    levelStats,
  }

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return 'bg-gray-100 border-gray-300 text-gray-700'
      case 'rare':
        return 'bg-blue-100 border-blue-300 text-blue-700'
      case 'epic':
        return 'bg-purple-100 border-purple-300 text-purple-700'
      case 'legendary':
        return 'bg-yellow-100 border-yellow-400 text-yellow-800'
      default:
        return 'bg-gray-100 border-gray-300 text-gray-700'
    }
  }

  const getRarityLabel = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return '일반'
      case 'rare':
        return '레어'
      case 'epic':
        return '에픽'
      case 'legendary':
        return '전설'
      default:
        return '일반'
    }
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
      {ALL_BADGES.map((badge, index) => {
        const isEarned = earnedBadges.includes(badge.id)
        const progress = calculateBadgeProgress(badge, context)

        return (
          <motion.div
            key={badge.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.02 }}
            className={`relative p-3 rounded-lg border ${
              isEarned
                ? getRarityColor(badge.rarity)
                : 'bg-gray-50 border-gray-200 opacity-50'
            }`}
          >
            {/* 아이콘 */}
            <div className="text-center mb-1.5">
              <div
                className={`text-3xl ${
                  isEarned ? '' : 'grayscale opacity-50'
                }`}
              >
                {badge.icon}
              </div>
            </div>

            {/* 배지 이름 */}
            <div className="text-center mb-1">
              <div className="text-body font-semibold text-text-main">{badge.name}</div>
              <div className="text-label text-text-sub mt-0.5">
                {badge.description}
              </div>
            </div>

            {/* 레어도 */}
            <div className="text-center">
              <span className="text-label px-1.5 py-0.5 rounded-full bg-white bg-opacity-50">
                {getRarityLabel(badge.rarity)}
              </span>
            </div>

            {/* 진행도 (미획득 배지만) */}
            {!isEarned && progress > 0 && progress < 1 && (
              <div className="mt-2">
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${progress * 100}%` }}
                  />
                </div>
                <div className="text-center text-label text-text-sub mt-0.5">
                  {Math.round(progress * 100)}%
                </div>
              </div>
            )}

            {/* 획득 마크 */}
            {isEarned && (
              <div className="absolute top-1.5 right-1.5">
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white text-xs">
                  ✓
                </div>
              </div>
            )}
          </motion.div>
        )
      })}
    </div>
  )
}

