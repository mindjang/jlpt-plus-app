'use client'

import React, { useState, useEffect, useImperativeHandle, forwardRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../auth/AuthProvider'
import { ExampleCard } from './ExampleCard'
import { QuizCard } from './QuizCard'
import type { StudyCard } from '@/lib/types/srs'
import { useStudyQueue } from '@/hooks/useStudyQueue'
import { minutesToDays } from '@/lib/srs/core/reviewCard'
import { getLevelGradient } from '@/data'
import {
  evaluateCard,
  updateQueueAfterEvaluation,
  addToPendingUpdates,
  saveCardStateImmediate,
  savePendingUpdates,
} from '@/lib/srs/evaluation/cardEvaluation'
import { calculateStudyStats } from '@/lib/srs/progress/studyStats'
import type { JlptLevel } from '@/lib/types/content'
import type { KanjiAliveEntry } from '@/data/types'
import type { NaverWord } from '@/data/types'
import type { Grade, UserCardState } from '@/lib/types/srs'
import { useMembership } from '../membership/MembershipProvider'
import { PaywallOverlay } from '../membership/PaywallOverlay'
import { logger } from '@/lib/utils/logger'
import { ProgressDisplay } from '../ui/ProgressDisplay'
import { SessionCompleteModal } from './SessionCompleteModal'

interface StudySessionProps {
  level: string
  words: NaverWord[]
  kanjis: KanjiAliveEntry[]
  mode: 'example' | 'quiz'
  dailyNewLimit?: number
  initialCompleted?: number // 세션 재진입 시 이미 완료한 개수
  onTimeUpdate?: (seconds: number) => void
  onCompleteChange?: (completed: boolean) => void
  onStudyStarted?: (started: boolean) => void // 학습 시작 여부 콜백
}

export interface StudySessionHandle {
  saveAndExit: () => Promise<void>
}

export const StudySession = forwardRef<StudySessionHandle, StudySessionProps>(({
  level,
  words,
  kanjis,
  mode,
  dailyNewLimit = 10,
  initialCompleted = 0,
  onTimeUpdate,
  onCompleteChange,
  onStudyStarted,
}, ref) => {
  const router = useRouter()
  const { user } = useAuth()
  const {
    status: membershipStatus,
    loading: membershipLoading,
    canStartSession,
    remainingSessions,
    recordSession,
  } = useMembership()
  const gradient = getLevelGradient(level.toLowerCase())
  const [sessionReserved, setSessionReserved] = useState(false)
  const [paywallMessage, setPaywallMessage] = useState<string | null>(null)

  const {
    queue: initialQueue,
    loading: queueLoading,
    error: queueError,
  } = useStudyQueue({
    uid: user?.uid || null,
    level: level as JlptLevel,
    words,
    kanjis,
    dailyNewLimit,
    canLoad: canStartSession || sessionReserved,
  })

  const [queue, setQueue] = useState<StudyCard[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [sessionInitialQueue, setSessionInitialQueue] = useState<StudyCard[]>([]) // 세션 시작 시 초기 큐 (통계 계산용)
  const [initialQueueLength, setInitialQueueLength] = useState(0) // 세션 시작 시 총 카드 수
  const [completedCount, setCompletedCount] = useState(initialCompleted) // 완료한 카드 수 (again 제외)
  const [pendingUpdates, setPendingUpdates] = useState<Map<string, UserCardState>>(new Map())
  const [loading, setLoading] = useState(true)
  const [studyTime, setStudyTime] = useState(0) // 학습 시간 (초)
  const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null)
  const [nextReviewInterval, setNextReviewInterval] = useState<number | null>(null)
  const [isCompleted, setIsCompleted] = useState(false) // 학습 완료 여부
  const [completedStats, setCompletedStats] = useState<{
    totalCards: number
    newCards: number
    reviewCards: number
    studyTime: number
  } | null>(null)
  const [isSaving, setIsSaving] = useState(false) // 저장 중 상태

  // 세션 종료 처리 (배치 저장 + 통계 계산)
  const finishSession = async (finalQueue: StudyCard[]) => {
    setIsSaving(true)
    try {
      // 비회원/만료 회원: 실제 세션 완료 시 1회차 소진 처리
      if (user && membershipStatus !== 'member' && !sessionReserved) {
        try {
          await recordSession()
          setSessionReserved(true) // 동일 세션 내 재확인용
        } catch (error) {
          logger.error('[StudySession] recordSession on finish failed:', error)
        }
      }

      if (pendingUpdates.size > 0 && user) {
        const emptyMap = await savePendingUpdates(user.uid, pendingUpdates)
        setPendingUpdates(emptyMap)
      }

      // 초기 큐를 사용하여 통계 계산 (실제 학습한 카드 수 반영)
      const queueForStats = sessionInitialQueue.length > 0 ? sessionInitialQueue : finalQueue
      const stats = calculateStudyStats(queueForStats, studyTime)
      setCompletedStats(stats)
      setIsCompleted(true)
      onCompleteChange?.(true)
    } finally {
      setIsSaving(false)
    }
  }

  // 나가기 전 데이터 저장 함수
  const saveAndExit = useCallback(async () => {
    if (pendingUpdates.size > 0 && user) {
      setIsSaving(true)
      try {
        await savePendingUpdates(user.uid, pendingUpdates)
        setPendingUpdates(new Map())
      } catch (error) {
        logger.error('[StudySession] savePendingUpdates on exit failed:', error)
      } finally {
        setIsSaving(false)
      }
    }
  }, [pendingUpdates, user])

  // ref를 통해 부모 컴포넌트에서 saveAndExit 호출 가능하도록 expose
  useImperativeHandle(ref, () => ({
    saveAndExit,
  }), [saveAndExit])

  // 학습 큐 동기화
  useEffect(() => {
    if (initialQueue.length > 0 && queue.length === 0) {
      setQueue(initialQueue)
      setSessionInitialQueue(initialQueue) // 초기 큐 저장 (통계 계산용)
      setInitialQueueLength(initialQueue.length)
      setCompletedCount(initialCompleted)
      setCurrentIndex(0)
      setIsCompleted(false)
      setCompletedStats(null)
    }
    setLoading(queueLoading)
  }, [initialQueue, queueLoading, queue.length, initialCompleted])

  // 타이머 시작
  useEffect(() => {
    if (loading || queue.length === 0) return

    const interval = setInterval(() => {
      setStudyTime((prev) => prev + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [loading, queue.length])

  // studyTime 변경 시 부모 컴포넌트에 알림 (렌더링 후 호출)
  useEffect(() => {
    if (studyTime > 0 && onTimeUpdate) {
      // setTimeout을 사용하여 렌더링 사이클 이후에 호출
      const timeoutId = setTimeout(() => {
        onTimeUpdate(studyTime)
      }, 0)
      return () => clearTimeout(timeoutId)
    }
  }, [studyTime, onTimeUpdate])

  // 부모에 완료 상태 초기화 전달
  useEffect(() => {
    onCompleteChange?.(false)
  }, [onCompleteChange])

  // 배치 업데이트 (세션 종료 시 또는 일정 간격으로)
  useEffect(() => {
    if (pendingUpdates.size === 0 || !user) return

    const interval = setInterval(async () => {
      if (pendingUpdates.size > 0) {
        const emptyMap = await savePendingUpdates(user.uid, pendingUpdates)
        setPendingUpdates(emptyMap)
      }
    }, 5000) // 5초마다 배치 저장

    return () => clearInterval(interval)
  }, [pendingUpdates, user])

  // 무료 회차 사용 여부 안내 (비회원/만료 회원)
  useEffect(() => {
    if (!user || membershipLoading) return
    if (!canStartSession && !sessionReserved) {
      setPaywallMessage('오늘의 무료 학습 회차를 모두 사용했어요. 회원권이 필요합니다.')
    } else {
      setPaywallMessage(null)
    }
  }, [user, membershipLoading, canStartSession, sessionReserved])

  const handleGrade = (grade: Grade) => {
    if (!user) return

    const currentCard = queue[currentIndex]
    if (!currentCard) return

    // 카드 평가 및 상태 업데이트
    const { updatedState, nextReviewInterval } = evaluateCard(currentCard, grade)

    // 로컬 상태에 저장 (배치 업데이트용)
    setPendingUpdates((prev) => addToPendingUpdates(prev, updatedState))

    // 즉시 저장도 수행
    saveCardStateImmediate(user.uid, updatedState)

    // 상태 변경 콜백 호출 (UI 업데이트용)
    handleGradeStateChange(grade, nextReviewInterval)

    // 진행도 집계: "again"은 분모를 유지하되 완료 카드로 세지 않음
    if (grade !== 'again') {
      setCompletedCount((prev) => Math.min(initialQueueLength, prev + 1))
    }

    // 큐 업데이트 (다시 학습인 경우 랜덤 위치로 재삽입)
    const { updatedQueue, nextIndex } = updateQueueAfterEvaluation(
      queue,
      currentIndex,
      currentCard,
      updatedState,
      grade
    )

    setQueue(updatedQueue)

    // 다음 카드로 이동 (분모 유지; "again"은 재삽입 위치로 이동, 나머지는 동일 인덱스)
    setTimeout(() => {
      if (grade === 'again') {
        setCurrentIndex(nextIndex)
        return
      }

      if (updatedQueue.length === 0) {
        // 마지막 카드였던 경우 세션 종료
        finishSession(queue)
        return
      }

      setCurrentIndex(nextIndex)
    }, 500)
  }

  const handleGradeStateChange = (grade: Grade | null, interval: number | null) => {
    setSelectedGrade(grade)
    setNextReviewInterval(interval)
  }

  // 카드가 변경될 때 상태 초기화
  useEffect(() => {
    setSelectedGrade(null)
    setNextReviewInterval(null)
  }, [currentIndex])

  // 학습 시작 여부 감지 (카드 평가 또는 시간 경과)
  useEffect(() => {
    const hasStarted = completedCount > initialCompleted || studyTime > 0
    onStudyStarted?.(hasStarted)
  }, [completedCount, initialCompleted, studyTime, onStudyStarted])

  const handleNext = async () => {
    if (currentIndex < queue.length - 1) {
      setCurrentIndex(currentIndex + 1)
    } else {
      // 세션 종료
      finishSession(queue)
    }
  }

  if (!user || (!canStartSession && !sessionReserved && !membershipLoading)) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center p-4 relative">
        <div className="text-body text-text-sub">학습을 시작하려면 로그인 및 회원권이 필요합니다.</div>
        <PaywallOverlay
          title={!user ? '로그인이 필요합니다' : '오늘의 무료 학습 회차가 모두 소진되었어요'}
          description={
            !user
              ? '로그인 후 학습을 시작해주세요.'
              : '비회원은 하루 1회차만 학습할 수 있어요. 회원권을 등록하면 무제한 학습이 가능합니다.'
          }
          showRedeem={!!user}
        />
      </div>
    )
  }

  if (membershipLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-body text-text-sub">학습 큐를 불러오는 중...</div>
      </div>
    )
  }

  // 학습 완료 화면
  if (isCompleted && completedStats) {
    return <SessionCompleteModal stats={completedStats} />
  }

  if (queue.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-title text-text-main mb-4">학습할 카드가 없습니다.</p>
          <p className="text-body text-text-sub">모든 카드를 완료했거나 새로운 카드가 없습니다.</p>
        </div>
      </div>
    )
  }

  const currentCard = queue[currentIndex]

  // currentCard가 없는 경우 (인덱스 범위 초과 등)
  if (!currentCard) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-title text-text-main mb-4">카드를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  // 세션 분모는 처음 큐 길이를 고정 사용 (알고있음으로 큐가 줄어도 유지)
  // 분모: 이전에 학습한 개수 + 이번 세션 로드된 큐 길이
  const totalCount = initialCompleted + initialQueueLength
  // 분자: 완료 개수(현재 보고 있는 카드는 포함하지 않음)
  const displayIndex = totalCount === 0 ? 0 : Math.min(completedCount, totalCount)

  return (
    <div className="flex flex-col w-full h-[calc(100vh-10rem)] relative">
      {/* 저장 중 로딩 오버레이 */}
      {isSaving && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-surface rounded-card shadow-soft p-6 flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-body text-text-main font-medium">데이터를 저장하는 중입니다...</p>
          </div>
        </div>
      )}

      {/* 진행도 바 */}
      <div className="my-2 px-4">
        <ProgressDisplay
          current={displayIndex}
          total={totalCount}
          color={gradient.to}
          className="flex items-center justify-between gap-3 py-1 px-2"
        />
      </div>

      {/* 카드 표시 */}
      {mode === 'example' ? (
        <ExampleCard
          item={currentCard.data}
          itemId={currentCard.itemId}
          type={currentCard.type}
          level={currentCard.level}
          isNew={currentCard.cardState === null}
          cardState={currentCard.cardState}
          onGrade={handleGrade}
          onNext={handleNext}
          allWords={words}
          onGradeStateChange={handleGradeStateChange}
          className="flex-1"
        />
      ) : (
        <div className="flex items-center justify-center flex-1 text-body text-text-sub">
          퀴즈 모드는 준비중입니다.
        </div>
      )}

      {/* 하단 고정 Footer (평가 버튼) - 예제 모드에서만 표시 */}
      {mode === 'example' && (
        <div className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-surface border-t border-divider shadow-top z-40 px-4 py-3">
          <div className="flex gap-2">
            <button
              onClick={() => handleGrade('again')}
              className={`button-press flex-1 py-4 px-4 rounded-card text-body font-medium transition-colors ${selectedGrade === 'again'
                  ? 'bg-gray-300 text-text-main'
                  : 'bg-gray-200 text-text-main hover:bg-gray-250'
                }`}
            >
              다시 학습
            </button>
            <button
              onClick={() => handleGrade('good')}
              className={`button-press flex-1 py-4 px-4 rounded-card text-body font-medium transition-colors ${selectedGrade === 'good'
                  ? 'bg-gray-600 text-white'
                  : 'bg-gray-500 text-white hover:bg-gray-550'
                }`}
            >
              <div>알고있음</div>
              {selectedGrade === 'good' && nextReviewInterval !== null && (
                <div className="text-label mt-1">
                  {nextReviewInterval < 1440
                    ? `${Math.round(nextReviewInterval / 60)}시간 후 복습`
                    : `${minutesToDays(nextReviewInterval)}일 후 복습`
                  }
                </div>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
})

StudySession.displayName = 'StudySession'

