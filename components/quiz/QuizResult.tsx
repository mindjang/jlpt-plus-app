'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import type { QuizResult } from '@/lib/types/quiz'
import { getLevelTitle } from '@/lib/quiz/expSystem'
import { Trophy, Zap, Clock, Target, TrendingUp, Award, XCircle, CheckCircle2 } from 'lucide-react'

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
  
  // 점수에 따른 그라데이션 색상
  const getScoreGradient = () => {
    if (result.score >= 90) return 'from-yellow-400 via-orange-400 to-red-500'
    if (result.score >= 70) return 'from-blue-400 via-purple-400 to-pink-500'
    if (result.score >= 50) return 'from-green-400 via-teal-400 to-cyan-500'
    return 'from-gray-400 via-gray-500 to-gray-600'
  }
  
  // 점수에 따른 등급 텍스트와 이모지
  const getGradeInfo = () => {
    if (result.score >= 90) return { text: '완벽해요!', emoji: '🏆', color: 'text-yellow-600' }
    if (result.score >= 70) return { text: '훌륭해요!', emoji: '✨', color: 'text-purple-600' }
    if (result.score >= 50) return { text: '좋아요!', emoji: '👍', color: 'text-green-600' }
    return { text: '다시 도전!', emoji: '💪', color: 'text-gray-600' }
  }
  
  const gradeInfo = getGradeInfo()
  const accuracyPercent = Math.round(result.accuracy * 100)
  const wrongCount = result.totalQuestions - result.correctCount

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 pb-20">
      {/* 헤더 영역 - 점수 강조 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={`bg-gradient-to-br ${getScoreGradient()} text-white pt-20 pb-12 px-4`}
      >
        <div className="max-w-lg mx-auto text-center">
          {/* 등급 배지 */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="mb-6"
          >
            <div className="inline-block text-6xl mb-4">{gradeInfo.emoji}</div>
            <div className={`text-title font-black mb-2 ${gradeInfo.color === 'text-yellow-600' ? 'text-yellow-100' : gradeInfo.color === 'text-purple-600' ? 'text-purple-100' : gradeInfo.color === 'text-green-600' ? 'text-green-100' : 'text-gray-100'}`}>
              {gradeInfo.text}
            </div>
          </motion.div>
          
          {/* 메인 점수 */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 150 }}
            className="mb-4"
          >
            <div className="text-7xl font-black mb-2">
              {result.score}
            </div>
            <div className="text-subtitle font-semibold opacity-90">점</div>
          </motion.div>
          
          {/* 정답률 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6"
          >
            <div className="text-title font-bold mb-1">
              {result.correctCount} / {result.totalQuestions}
            </div>
            <div className="text-lg opacity-90">정답</div>
          </motion.div>
        </div>
      </motion.div>

      {/* 메인 컨텐츠 */}
      <div className="max-w-lg mx-auto px-4 -mt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-lg overflow-hidden border border-divider"
        >
          {/* 통계 카드들 */}
          <div className="p-6 grid grid-cols-3 gap-3 border-b border-gray-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 text-center"
            >
              <Zap className="w-6 h-6 mx-auto mb-2 text-green-600" />
              <div className="text-label text-gray-600 mb-1 font-medium">경험치</div>
              <div className="text-subtitle font-black text-green-700">
                +{result.expGained}
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 }}
              className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-4 text-center"
            >
              <Clock className="w-6 h-6 mx-auto mb-2 text-blue-600" />
              <div className="text-label text-gray-600 mb-1 font-medium">평균 시간</div>
              <div className="text-subtitle font-black text-blue-700">
                {(result.averageTimePerQuestion / 1000).toFixed(1)}초
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7 }}
              className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 text-center"
            >
              <Target className="w-6 h-6 mx-auto mb-2 text-purple-600" />
              <div className="text-label text-gray-600 mb-1 font-medium">정확도</div>
              <div className="text-subtitle font-black text-purple-700">
                {accuracyPercent}%
              </div>
            </motion.div>
          </div>

          {/* 레벨업 표시 */}
          {result.leveledUp && result.newLevel && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8, type: 'spring' }}
              className="mx-6 mt-6 mb-6 p-6 bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-500 rounded-lg text-white relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-10 rounded-full -ml-12 -mb-12"></div>
              <div className="relative z-10 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.9, type: 'spring', stiffness: 200 }}
                  className="text-5xl mb-3"
                >
                  🎉
                </motion.div>
                <div className="text-2xl font-black mb-2">레벨 업!</div>
                <div className="text-lg font-semibold opacity-90">
                  레벨 {result.newLevel} - {getLevelTitle(result.newLevel)}
                </div>
              </div>
            </motion.div>
          )}

          {/* 획득한 배지 */}
          {result.badgesEarned.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="mx-6 mb-6 p-6 bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 rounded-lg border border-yellow-200"
            >
              <div className="flex items-center justify-center gap-2 mb-4">
                <Award className="w-6 h-6 text-yellow-600" />
                <div className="text-subtitle font-black text-yellow-800">
                  새 배지 획득!
                </div>
              </div>
              <div className="flex flex-wrap justify-center gap-3">
                {result.badgesEarned.map((badgeId) => (
                  <motion.div
                    key={badgeId}
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                    className="px-4 py-2 bg-white rounded-lg text-sm font-bold text-yellow-800 border border-yellow-300"
                  >
                    {badgeId}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* 틀린 문제 요약 */}
          {hasWrongAnswers && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 }}
              className="mx-6 mb-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <XCircle className="w-5 h-5 text-red-500" />
                <div className="text-subtitle font-black text-gray-900">
                  틀린 문제
                </div>
                <div className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-bold">
                  {result.weakPoints.length}개
                </div>
              </div>
              <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                {result.weakPoints.slice(0, 5).map((weak, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.1 + index * 0.1 }}
                    className="p-4 bg-gradient-to-br from-red-50 to-pink-50 rounded-lg border border-red-100"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="text-label text-gray-600 mb-1 font-medium">문제</div>
                        <div className="text-body text-gray-900 font-semibold mb-3">
                          <span dangerouslySetInnerHTML={{ __html: weak.question }} />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div className="p-2 bg-green-50 rounded-lg border border-green-100">
                            <div className="text-xs text-green-700 font-medium mb-1 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              정답
                            </div>
                            <div className="text-body font-semibold text-green-800">
                              <span dangerouslySetInnerHTML={{ __html: weak.correctAnswer }} />
                            </div>
                          </div>
                          <div className="p-2 bg-red-50 rounded-lg border border-red-100">
                            <div className="text-xs text-red-700 font-medium mb-1 flex items-center gap-1">
                              <XCircle className="w-3 h-3" />
                              선택
                            </div>
                            <div className="text-sm font-bold text-red-800">
                              <span dangerouslySetInnerHTML={{ __html: weak.userAnswer }} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* 버튼 영역 */}
          <div className="p-6 pt-0 space-y-3">
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
              onClick={onRestart}
                className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg text-base font-bold active:opacity-80 flex items-center justify-center gap-2"
            >
              <Zap className="w-5 h-5" />
              다시 퀴즈 시작
            </motion.button>
            {/* {hasWrongAnswers && onReviewWrong && (
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.3 }}
                onClick={onReviewWrong}
                className="w-full py-4 px-6 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg text-body font-semibold active:opacity-80 flex items-center justify-center gap-2"
              >
                <Target className="w-5 h-5" />
                틀린 문제 복습하기
              </motion.button>
            )} */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: hasWrongAnswers && onReviewWrong ? 1.4 : 1.3 }}
              onClick={() => router.push('/quiz')}
              className="w-full py-4 px-6 bg-white border border-divider text-gray-700 rounded-lg text-body font-semibold active:bg-gray-50"
            >
              메뉴로 돌아가기
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

