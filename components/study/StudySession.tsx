'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { ExampleCard } from './ExampleCard'
import { QuizCard } from './QuizCard'
import { getTodayQueues, type StudyCard } from '@/lib/srs/studyQueue'
import { reviewCard } from '@/lib/srs/reviewCard'
import { saveCardState, saveCardStatesBatch } from '@/lib/firebase/firestore'
import type { Word, Kanji } from '@/lib/types/content'
import type { Grade } from '@/lib/types/srs'

interface StudySessionProps {
  level: string
  words: Word[]
  kanjis: Kanji[]
  mode: 'example' | 'quiz'
  dailyNewLimit?: number
  onTimeUpdate?: (seconds: number) => void
}

export function StudySession({
  level,
  words,
  kanjis,
  mode,
  dailyNewLimit = 10,
  onTimeUpdate,
}: StudySessionProps) {
  const { user } = useAuth()
  const [queue, setQueue] = useState<StudyCard[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [pendingUpdates, setPendingUpdates] = useState<Map<string, any>>(new Map())
  const [loading, setLoading] = useState(true)
  const [studyTime, setStudyTime] = useState(0) // 학습 시간 (초)
  const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null)
  const [nextReviewInterval, setNextReviewInterval] = useState<number | null>(null)

  // 학습 큐 로드
  useEffect(() => {
    if (!user) return

    const loadQueue = async () => {
      setLoading(true)
      try {
        const queues = await getTodayQueues(
          user.uid,
          level as any,
          words,
          kanjis,
          dailyNewLimit
        )
        setQueue(queues.mixedQueue)
      } catch (error) {
        console.error('Failed to load study queue:', error)
      } finally {
        setLoading(false)
      }
    }

    loadQueue()
  }, [user, level, words, kanjis, dailyNewLimit])

  // 타이머 시작
  useEffect(() => {
    if (loading || queue.length === 0) return

    const interval = setInterval(() => {
      setStudyTime((prev) => {
        const newTime = prev + 1
        onTimeUpdate?.(newTime)
        return newTime
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [loading, queue.length, onTimeUpdate])

  // 배치 업데이트 (세션 종료 시 또는 일정 간격으로)
  useEffect(() => {
    if (pendingUpdates.size === 0) return

    const interval = setInterval(() => {
      if (pendingUpdates.size > 0 && user) {
        const updates = Array.from(pendingUpdates.values())
        saveCardStatesBatch(user.uid, updates)
        setPendingUpdates(new Map())
      }
    }, 5000) // 5초마다 배치 저장

    return () => clearInterval(interval)
  }, [pendingUpdates, user])

  const handleGrade = (grade: Grade) => {
    if (!user) return

    const currentCard = queue[currentIndex]
    if (!currentCard) return

    // SRS 업데이트
    const updatedState = reviewCard(currentCard.cardState, {
      itemId: currentCard.itemId,
      type: currentCard.type,
      level: currentCard.level,
      grade,
    })

    // 로컬 상태에 저장 (배치 업데이트용)
    setPendingUpdates((prev) => {
      const next = new Map(prev)
      next.set(currentCard.itemId, updatedState)
      return next
    })

    // 즉시 저장도 수행 (선택적)
    saveCardState(user.uid, updatedState)
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

  const handleNext = () => {
    if (currentIndex < queue.length - 1) {
      setCurrentIndex(currentIndex + 1)
    } else {
      // 세션 종료
      if (pendingUpdates.size > 0 && user) {
        const updates = Array.from(pendingUpdates.values())
        saveCardStatesBatch(user.uid, updates)
        setPendingUpdates(new Map())
      }
      alert('오늘의 학습을 완료했습니다!')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-body text-text-sub">학습 큐를 불러오는 중...</div>
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
  const progress = ((currentIndex + 1) / queue.length) * 100

  return (
    <div className="w-full pb-24">
      {/* 진행도 바 */}
      <div className="mb-6 px-4">
        <div className="h-1 bg-divider rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-2 text-body text-text-sub text-center">
          {currentIndex + 1} / {queue.length}
        </div>
      </div>

      {/* 카드 표시 */}
      {mode === 'example' ? (
        <ExampleCard
          item={currentCard.data}
          type={currentCard.type}
          level={currentCard.level}
          isNew={currentCard.cardState === null}
          cardState={currentCard.cardState}
          onGrade={handleGrade}
          onNext={handleNext}
          allWords={words}
          onGradeStateChange={handleGradeStateChange}
        />
      ) : (
        <QuizCard
          item={currentCard.data}
          type={currentCard.type}
          level={currentCard.level}
          allItems={[...words, ...kanjis]}
          isNew={currentCard.cardState === null}
          onGrade={handleGrade}
          onNext={handleNext}
        />
      )}

      {/* 하단 고정 Footer (평가 버튼) */}
      <div className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-surface border-t border-divider shadow-top z-40 px-4 py-3">
        <div className="flex gap-2">
          <button
            onClick={() => handleGrade('again')}
            className={`button-press flex-1 py-4 px-4 rounded-card text-body font-medium transition-colors ${
              selectedGrade === 'again'
                ? 'bg-gray-300 text-text-main'
                : 'bg-gray-200 text-text-main hover:bg-gray-250'
            }`}
          >
            다시 학습
          </button>
          <button
            onClick={() => handleGrade('good')}
            className={`button-press flex-1 py-4 px-4 rounded-card text-body font-medium transition-colors ${
              selectedGrade === 'good'
                ? 'bg-gray-600 text-white'
                : 'bg-gray-500 text-white hover:bg-gray-550'
            }`}
          >
            <div>알고있음</div>
            {selectedGrade === 'good' && nextReviewInterval !== null && (
              <div className="text-label mt-1">{nextReviewInterval}일 후 복습</div>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

