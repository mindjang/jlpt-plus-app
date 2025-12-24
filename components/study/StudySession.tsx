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
import { useFeatureAccess } from '@/lib/permissions'
import { FeatureGuard } from '../permissions/FeatureGuard'
import { logger } from '@/lib/utils/logger'
import { ProgressDisplay } from '../ui/ProgressDisplay'
import { BrandLoader } from '../ui/BrandLoader'

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
  onCompleteClose?: () => void // 학습 완료 후 닫기 핸들러
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
  onCompleteClose,
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
  const studySessionAccess = useFeatureAccess('study_session')
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
    canLoad: studySessionAccess.allowed || sessionReserved,
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
  const [cardStartTime, setCardStartTime] = useState<number>(Date.now()) // 현재 카드 시작 시간
  const [isSaving, setIsSaving] = useState(false) // 저장 중 상태
  const [finishing, setFinishing] = useState(false) // 학습 완료 처리 중 상태

  // 세션 종료 처리 (배치 저장 + 통계 계산)
  const finishSession = async (finalQueue: StudyCard[]) => {
    setFinishing(true)
    setIsSaving(true)
    try {
      // 세션은 이미 시작 시 예약되었으므로 여기서는 저장만 수행
      if (pendingUpdates.size > 0 && user) {
        const emptyMap = await savePendingUpdates(user.uid, pendingUpdates)
        setPendingUpdates(emptyMap)
      }

      // 초기 큐를 사용하여 통계 계산 (실제 학습한 카드 수 반영)
      const queueForStats = sessionInitialQueue.length > 0 ? sessionInitialQueue : finalQueue
      const stats = calculateStudyStats(queueForStats, studyTime)

      // 타입 결정 (words 배열이 있으면 'word', kanjis 배열이 있으면 'kanji')
      const contentType = words.length > 0 ? 'word' : 'kanji'

      // sessionStorage에 결과 저장
      sessionStorage.setItem('studyResult', JSON.stringify(stats))

      // 자동 학습 페이지로 돌아가기 위한 레벨과 타입 정보 저장
      sessionStorage.setItem('studyReturnInfo', JSON.stringify({
        level: level.toLowerCase(),
        type: contentType,
      }))

      // 결과 페이지 로드 완료 플래그 설정
      sessionStorage.setItem('studyResultLoading', 'true')

      // 결과 화면으로 리다이렉트
      router.push('/practice/result')

      // 페이지 전환이 완료될 때까지 충분한 딜레이 후 finishing 상태 해제
      setTimeout(() => {
        setIsSaving(false)
        // 추가 딜레이 후 finishing 상태 해제 (결과 화면이 완전히 렌더링될 때까지)
        setTimeout(() => {
          setFinishing(false)
        }, 500)
      }, 300)
    } catch (error) {
      setIsSaving(false)
      setFinishing(false)
      logger.error('[StudySession] Error finishing session:', error)
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

  // 학습 큐 동기화 및 세션 예약
  useEffect(() => {
    if (initialQueue.length > 0 && queue.length === 0) {
      setQueue(initialQueue)
      setSessionInitialQueue(initialQueue) // 초기 큐 저장 (통계 계산용)
      setInitialQueueLength(initialQueue.length)
      setCompletedCount(initialCompleted)
      setCurrentIndex(0)
      setCardStartTime(Date.now()) // 첫 카드 시작 시간 설정

      // 큐가 로드되면 즉시 세션 예약 (무료 회차 소진)
      if (user && membershipStatus !== 'member' && !sessionReserved && studySessionAccess.allowed) {
        recordSession()
          .then(() => {
            setSessionReserved(true)
            logger.info('[StudySession] Free session reserved on queue load')
          })
          .catch((error) => {
            logger.error('[StudySession] Failed to reserve session:', error)
          })
      }
    }
    setLoading(queueLoading)
  }, [initialQueue, queueLoading, queue.length, initialCompleted, user, membershipStatus, sessionReserved, studySessionAccess.allowed, recordSession])

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
      setPaywallMessage('오늘도 학습을 완료하셨어요. 수고하셨어요! 현재는 하루 1회만 학습할 수 있어요.')
    } else {
      setPaywallMessage(null)
    }
  }, [user, membershipLoading, canStartSession, sessionReserved])

  const handleGrade = async (grade: Grade) => {
    if (!user) return

    const currentCard = queue[currentIndex]
    if (!currentCard) return

    // 실제 카드 학습 시간 측정 (밀리초)
    const now = Date.now()
    const actualTimeSpent = now - cardStartTime

    // 카드 평가 및 상태 업데이트
    const { updatedState, nextReviewInterval } = evaluateCard(currentCard, grade)

    // 로컬 상태에 저장 (배치 업데이트용)
    setPendingUpdates((prev) => addToPendingUpdates(prev, updatedState))

    // 즉시 저장도 수행
    saveCardStateImmediate(user.uid, updatedState)

    // 일별 활동 통계 업데이트
    try {
      const { updateDailyActivity, updateStreak, isFirstStudyToday } = await import('@/lib/firebase/firestore/dailyActivity')

      await updateDailyActivity(user.uid, {
        mode: 'exampleStudy',
        questions: 1,
        correct: grade === 'good' || grade === 'easy' ? 1 : 0,
        timeSpent: actualTimeSpent, // 실제 측정된 시간 사용
        contentType: currentCard.type,
        level: currentCard.level,
      })

      // 연속 일수 체크 (매일 첫 학습)
      const isFirst = await isFirstStudyToday(user.uid)
      if (isFirst) {
        await updateStreak(user.uid)
      }
    } catch (error) {
      console.error('[StudySession] Error updating stats:', error)
    }

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

    // 마지막 카드였는지 먼저 확인 (again이 아니고 큐가 비어있는 경우)
    if (grade !== 'again' && updatedQueue.length === 0) {
      // finishing 상태를 먼저 설정하여 리렌더링 시 로딩 화면이 표시되도록 함
      setFinishing(true)
      // 큐 업데이트는 하지 않고 바로 세션 종료
      finishSession(queue)
      return
    }

    setQueue(updatedQueue)

    // 다음 카드 시작 시간 설정
    if (nextIndex < updatedQueue.length) {
      setCardStartTime(Date.now())
    }

    // 다음 카드로 이동 (분모 유지; "again"은 재삽입 위치로 이동, 나머지는 동일 인덱스)
    setTimeout(() => {
      if (grade === 'again') {
        setCurrentIndex(nextIndex)
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
      setCardStartTime(Date.now()) // 다음 카드 시작 시간 설정
    } else {
      // 세션 종료 - finishing 상태를 먼저 설정하여 리렌더링 시 로딩 화면이 표시되도록 함
      setFinishing(true)
      finishSession(queue)
    }
  }

  // 권한 체크: 로딩 중이 아니고 세션이 예약되지 않았으며 접근 불가인 경우
  if (!membershipLoading && !sessionReserved && !studySessionAccess.allowed) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center p-4 relative">
        <div className="text-body text-text-sub">학습을 시작하려면 로그인 및 회원권이 필요합니다.</div>
        <FeatureGuard feature="study_session">
          <div />
        </FeatureGuard>
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

  // 학습 완료 처리 중 로딩 화면
  if (finishing) {
    return (
      <div className="fixed inset-0 z-[100] bg-white flex items-center justify-center">
        <BrandLoader fullScreen={false} text="결과를 계산하고 있어요..." />
      </div>
    )
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
  const displayIndex = totalCount === 0 ? 0 : Math.min(completedCount, totalCount) + 1

  return (
    <div className="flex flex-col w-full h-[calc(100vh-10rem)] relative bg-white">
      {/* 저장 중 로딩 오버레이 */}
      {isSaving && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-surface rounded-lg shadow-soft p-6 flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-body text-text-main font-medium">데이터를 저장하는 중입니다...</p>
          </div>
        </div>
      )}

      {/* 진행도 바 */}
      <div className="px-4 pt-2 pb-1">
        {/* 안내 메시지 */}
        {/* <div className="mb-2 px-3 py-2 bg-blue-50 border-l-4 border-blue-200 rounded-r-lg">
          <p className="text-label text-blue-800">
            💡 의미를 보는 것은 정답 보기가 아닙니다. 기억을 확인하는 과정이에요.
          </p>
        </div> */}

        <div className="flex items-center justify-between mb-1">
          <span className="text-label text-text-sub">
            {totalCount - displayIndex}개 남음
          </span>
          <span className="text-label text-text-sub font-medium">
            {displayIndex} / {totalCount}
          </span>
        </div>
        <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${(displayIndex / totalCount) * 100}%` }}
          />
        </div>
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
          {/* Primary 버튼 (good) */}
          <button
            onClick={() => handleGrade('good')}
            className={`w-full py-4 px-6 rounded-xl transition-colors mb-3 shadow-sm ${selectedGrade === 'good'
                ? 'bg-primary text-white shadow-md'
                : 'bg-primary text-white active:opacity-90'
              }`}
          >
            <div>기억났어요</div>
            {/* <div className="text-label mt-1 opacity-90">잘 기억하고 있어요</div> */}
            {/* {selectedGrade === 'good' && nextReviewInterval !== null && (
              <div className="text-label mt-1.5 opacity-75 text-sm">
                {nextReviewInterval < 1440
                  ? `${Math.round(nextReviewInterval / 60)}시간 후 복습`
                  : `${minutesToDays(nextReviewInterval)}일 후 복습`
                }
              </div>
            )} */}
          </button>

          {/* Secondary 버튼들 (again, hard, easy) */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleGrade('again')}
              className={`py-3 px-2 rounded-lg text-body font-medium transition-colors ${selectedGrade === 'again'
                  ? 'bg-gray-200 text-gray-700 border-2 border-gray-300'
                  : 'bg-gray-50 border border-gray-200 text-gray-600 active:bg-gray-100'
                }`}
            >
              <div className="font-semibold text-xs">몰라요</div>
            </button>
            <button
              onClick={() => handleGrade('hard')}
              className={`py-3 px-2 rounded-lg text-body font-medium transition-colors ${selectedGrade === 'hard'
                  ? 'bg-orange-100 border-2 border-orange-200 text-orange-700'
                  : 'bg-[#FFF9F2] border border-[#FFE4CC] text-[#D97706] active:bg-[#FFF2E5]'
                }`}
            >
              <div className="font-semibold text-xs">어려워요</div>
            </button>
            <button
              onClick={() => handleGrade('easy')}
              className={`py-3 px-2 rounded-lg text-body font-medium transition-colors ${selectedGrade === 'easy'
                  ? 'bg-emerald-100 border-2 border-emerald-200 text-emerald-700'
                  : 'bg-[#F2FBF9] border border-[#CCF2E9] text-[#059669] active:bg-[#E6F7F3]'
                }`}
            >
              <div className="font-semibold text-xs">쉬워요</div>
            </button>
          </div>
        </div>
      )}
    </div>
  )
})

StudySession.displayName = 'StudySession'

