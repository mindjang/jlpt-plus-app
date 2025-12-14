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
          <div className="text-display-l text-primary mb-2">🎉</div>
          <h1 className="text-title text-text-main font-bold mb-2">학습 완료!</h1>
          <p className="text-body text-text-sub">오늘의 학습을 완료했습니다</p>
        </div>

        <div className="space-y-4 mb-6">
          <div className="bg-page rounded-lg border border-divider p-4">
            <div className="text-label text-text-sub mb-1">총 학습 카드</div>
            <div className="text-display-m text-text-main font-bold">{stats.totalCards}개</div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-page rounded-lg border border-divider p-4">
              <div className="text-label text-text-sub mb-1">신규 카드</div>
              <div className="text-title text-text-main font-bold">{stats.newCards}개</div>
            </div>
            
            <div className="bg-page rounded-lg border border-divider p-4">
              <div className="text-label text-text-sub mb-1">복습 카드</div>
              <div className="text-title text-text-main font-bold">{stats.reviewCards}개</div>
            </div>
          </div>

          <div className="bg-page rounded-lg border border-divider p-4">
            <div className="text-label text-text-sub mb-1">학습 시간</div>
            <div className="text-title text-text-main font-bold">{formatStudyTime(stats.studyTime)}</div>
          </div>
        </div>

        <button
          onClick={handleClose}
          className="w-full py-4 px-6 rounded-lg bg-primary text-white text-body font-semibold active:opacity-80 transition-opacity cursor-pointer touch-manipulation"
          type="button"
        >
          이전 화면으로 돌아가기
        </button>
      </div>
    </div>
  )
}
