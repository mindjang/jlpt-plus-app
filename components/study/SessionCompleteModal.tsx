'use client'

import React, { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { formatStudyTime } from '@/lib/srs/progress/studyStats'
import type { StudySessionStats } from '@/lib/types/study'

interface SessionCompleteModalProps {
  /** 학습 통계 */
  stats: StudySessionStats
  /** 닫기 버튼 클릭 핸들러 (선택적, 없으면 router.back() 사용) */
  onClose?: () => void
}

/**
 * 학습 세션 완료 화면 컴포넌트
 * 학습 통계를 표시하고 이전 화면으로 돌아가는 버튼 제공
 */
export function SessionCompleteModal({
  stats,
  onClose,
}: SessionCompleteModalProps) {
  const router = useRouter()

  const handleClose = useCallback(() => {
    if (onClose) {
      onClose()
    } else {
      router.back()
    }
  }, [onClose, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-full max-w-md text-center">
        <div className="mb-6">
          <div className="text-display-l text-primary mb-3">🎉</div>
          <h1 className="text-2xl text-text-main font-bold mb-2">오늘도 수고하셨어요!</h1>
          <p className="text-body text-text-sub">오늘의 학습을 완료했어요</p>
        </div>

        <div className="mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 mb-4">
            <p className="text-body text-blue-800 mb-2">오늘의 요약</p>
            <p className="text-lg text-blue-900 font-semibold">
              오늘 {stats.totalCards}개를 학습했어요
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-body text-text-sub">신규 카드</span>
              <span className="text-body text-text-main font-medium">{stats.newCards}개</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-body text-text-sub">복습 카드</span>
              <span className="text-body text-text-main font-medium">{stats.reviewCards}개</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-body text-text-sub">학습 시간</span>
              <span className="text-body text-text-main font-medium">{formatStudyTime(stats.studyTime)}</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleClose}
          className="w-full py-5 px-6 rounded-xl bg-primary text-white text-lg font-bold active:opacity-90 transition-opacity cursor-pointer touch-manipulation shadow-sm"
          type="button"
        >
          완료했어요
        </button>
      </div>
    </div>
  )
}
