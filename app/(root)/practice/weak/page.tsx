'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import { AppBar } from '@/components/ui/AppBar'
import { getAllCardIds, getCardsByLevel } from '@/lib/firebase/firestore'
import type { UserCardState } from '@/lib/types/srs'

export default function WeakPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [weakCards, setWeakCards] = useState<UserCardState[]>([])

  useEffect(() => {
    if (user) {
      loadWeakCards()
    } else {
      setLoading(false)
    }
  }, [user])

  const loadWeakCards = async () => {
    if (!user) return

    try {
      const allCardIds = await getAllCardIds(user.uid)
      const weak: UserCardState[] = []

      // 모든 레벨의 카드 가져오기
      for (const level of ['N5', 'N4', 'N3', 'N2', 'N1'] as const) {
        const levelCards = await getCardsByLevel(user.uid, level)
        levelCards.forEach((card) => {
          // lapses가 2 이상인 카드만 약점으로 분류
          if (card.lapses >= 2) {
            weak.push(card)
          }
        })
      }

      // lapses 기준으로 정렬
      weak.sort((a, b) => b.lapses - a.lapses)
      setWeakCards(weak)
    } catch (error) {
      console.error('Failed to load weak cards:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="w-full">
        <AppBar title="약점노트" />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-body text-text-sub">로딩 중...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full overflow-hidden">
      <AppBar title="약점노트" />

      <div className="flex flex-col gap-4 p-4">
        {weakCards.length === 0 ? (
          <div className="bg-surface rounded-card shadow-soft p-6 text-center">
            <p className="text-body text-text-sub">약점 카드가 없습니다.</p>
            <p className="text-label text-text-sub mt-2">
              틀린 문제가 있으면 여기에 표시됩니다.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {weakCards.map((card) => (
              <div
                key={card.itemId}
                className="bg-surface rounded-card shadow-soft p-4"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="text-body font-medium text-text-main">
                      {card.itemId}
                    </div>
                    <div className="text-label text-text-sub mt-1">
                      {card.type === 'word' ? '단어' : '한자'} · {card.level}
                    </div>
                  </div>
                  <div className="text-body font-semibold text-red-500">
                    {card.lapses}회 오답
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => router.push(`/practice/learn?level=${card.level.toLowerCase()}&card=${card.itemId}`)}
                    className="flex-1 py-2 px-4 rounded-card bg-primary text-surface text-body font-medium button-press"
                  >
                    복습하기
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

