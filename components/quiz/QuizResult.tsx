'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import type { QuizResult } from '@/lib/types/quiz'
import { getLevelTitle } from '@/lib/quiz/expSystem'

interface QuizResultProps {
  result: QuizResult
  currentLevel: number
  onRestart: () => void
  onReviewWrong?: () => void
}

export function QuizResultScreen({
  result,
  currentLevel,
  onRestart,
  onReviewWrong,
}: QuizResultProps) {
  const router = useRouter()
  const hasWrongAnswers = result.weakPoints.length > 0

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-surface rounded-card shadow-soft p-8"
      >
        {/* 점수 표시 */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="inline-block"
          >
            <div className="text-display-xl font-bold text-primary mb-2">
              {result.score}점
            </div>
            <div className="text-title text-text-sub">
              {result.correctCount} / {result.totalQuestions} 정답
            </div>
          </motion.div>
        </div>

        {/* 등급 표시 */}
        <div className="text-center mb-6">
          <div className="inline-block px-6 py-3 bg-primary bg-opacity-10 rounded-card">
            <span className="text-title font-semibold text-primary">
              {result.score >= 90
                ? '🏆 완벽해요!'
                : result.score >= 70
                ? '✨ 훌륭해요!'
                : result.score >= 50
                ? '👍 좋아요!'
                : '💪 다시 도전!'}
            </span>
          </div>
        </div>

        {/* 통계 */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-page rounded-card p-4 text-center">
            <div className="text-label text-text-sub mb-1">획득 경험치</div>
            <div className="text-title font-semibold text-text-main">
              +{result.expGained} EXP
            </div>
          </div>
          <div className="bg-page rounded-card p-4 text-center">
            <div className="text-label text-text-sub mb-1">평균 시간</div>
            <div className="text-title font-semibold text-text-main">
              {(result.averageTimePerQuestion / 1000).toFixed(1)}초
            </div>
          </div>
        </div>

        {/* 레벨업 표시 */}
        {result.leveledUp && result.newLevel && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-8 p-6 bg-gradient-to-r from-primary to-blue-600 rounded-card text-white text-center"
          >
            <div className="text-display-s font-bold mb-2">🎉 레벨 업!</div>
            <div className="text-title">
              레벨 {result.newLevel} - {getLevelTitle(result.newLevel)}
            </div>
          </motion.div>
        )}

        {/* 획득한 배지 */}
        {result.badgesEarned.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-8 p-6 bg-yellow-50 rounded-card border-2 border-yellow-300"
          >
            <div className="text-center mb-4">
              <div className="text-title font-semibold text-yellow-800 mb-2">
                🎖️ 새 배지 획득!
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {result.badgesEarned.map((badgeId) => (
                  <div
                    key={badgeId}
                    className="px-3 py-1 bg-white rounded-full text-body text-yellow-800 border border-yellow-300"
                  >
                    {badgeId}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* 틀린 문제 요약 */}
        {hasWrongAnswers && (
          <div className="mb-8">
            <div className="text-body font-semibold text-text-main mb-3">
              틀린 문제 ({result.weakPoints.length}개)
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {result.weakPoints.slice(0, 5).map((weak, index) => (
                <div
                  key={index}
                  className="p-3 bg-red-50 rounded-card border border-red-200"
                >
                  <div className="text-body text-text-main mb-1">
                    <span className="font-semibold">Q: </span>
                    <span dangerouslySetInnerHTML={{ __html: weak.question }} />
                  </div>
                  <div className="text-label text-red-700">
                    <span className="font-semibold">정답: </span>
                    <span dangerouslySetInnerHTML={{ __html: weak.correctAnswer }} />
                  </div>
                  <div className="text-label text-text-sub">
                    <span className="font-semibold">선택: </span>
                    <span dangerouslySetInnerHTML={{ __html: weak.userAnswer }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 버튼 */}
        <div className="space-y-3">
          {hasWrongAnswers && onReviewWrong && (
            <button
              onClick={onReviewWrong}
              className="w-full py-4 bg-red-500 text-white rounded-card text-body font-semibold hover:bg-red-600 transition-colors"
            >
              틀린 문제 복습하기
            </button>
          )}
          <button
            onClick={onRestart}
            className="w-full py-4 bg-primary text-white rounded-card text-body font-semibold hover:bg-blue-600 transition-colors"
          >
            다시 퀴즈 시작
          </button>
          <button
            onClick={() => router.back()}
            className="w-full py-4 bg-surface border-2 border-divider text-text-main rounded-card text-body font-semibold hover:border-primary transition-colors"
          >
            나가기
          </button>
        </div>
      </motion.div>
    </div>
  )
}

