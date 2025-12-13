'use client'

import React, { Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { AppBar } from '@/components/ui/AppBar'
import { motion } from 'framer-motion'

function PracticeContent() {
  const router = useRouter()

  return (
    <div className="w-full overflow-hidden">
      <AppBar title="퀴즈존" onBack={() => router.back()} />

      <div className="flex flex-col gap-6 p-4 pb-20">
        {/* 퀴즈 시작 메인 버튼 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <button
            onClick={() => router.push('/practice/quiz')}
            className="w-full bg-gradient-to-br from-purple-500 to-purple-600 rounded-card shadow-lg p-8 text-center button-press hover:shadow-xl transition-all"
          >
            <div className="text-5xl mb-3">✏️</div>
            <div className="text-title font-bold text-white mb-2">퀴즈 시작하기</div>
            <div className="text-body text-white text-opacity-90">레벨업 시스템으로 즐겁게 학습하세요</div>
          </button>
        </motion.div>

        {/* 퀴즈 관련 서브 메뉴 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 gap-3"
        >
          <button
            onClick={() => router.push('/quiz/history')}
            className="bg-surface rounded-card shadow-soft p-6 text-center button-press hover:border-2 hover:border-primary transition-all"
          >
            <div className="text-3xl mb-2">📊</div>
            <div className="text-body font-semibold text-text-main mb-1">퀴즈 기록</div>
            <div className="text-label text-text-sub">히스토리 확인</div>
          </button>
          <button
            onClick={() => router.push('/quiz/badges')}
            className="bg-surface rounded-card shadow-soft p-6 text-center button-press hover:border-2 hover:border-primary transition-all"
          >
            <div className="text-3xl mb-2">🏆</div>
            <div className="text-body font-semibold text-text-main mb-1">배지 갤러리</div>
            <div className="text-label text-text-sub">획득한 배지</div>
          </button>
        </motion.div>
      </div>
    </div>
  )
}

export default function PracticePage() {
  return (
    <Suspense fallback={
      <div className="w-full">
        <AppBar title="퀴즈존" />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-body text-text-sub">로딩 중...</div>
        </div>
      </div>
    }>
      <PracticeContent />
    </Suspense>
  )
}

