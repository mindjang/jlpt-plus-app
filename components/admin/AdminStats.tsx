'use client'

import React, { useState, useEffect } from 'react'
import { getAllUsers, getAllGiftCodes } from '@/lib/firebase/firestore'
import { levelData } from '@/data'

export function AdminStats() {
  const [stats, setStats] = useState({
    users: 0,
    codes: 0,
    activeCodes: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const [users, codes] = await Promise.all([
          getAllUsers(),
          getAllGiftCodes()
        ])

        const activeCodes = codes.filter(c => {
          const uses = c.data.remainingUses
          return uses === null || uses === undefined || uses > 0
        }).length

        setStats({
          users: users.length,
          codes: codes.length,
          activeCodes
        })
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  const totalContent = Object.values(levelData).reduce((acc, curr) => acc + curr.words + curr.kanji, 0)

  if (loading) return <div>로딩 중...</div>

  return (
    <div className="space-y-6">
      <h3 className="text-subtitle font-semibold text-text-main">통계 분석</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-page rounded-lg p-4 border border-divider">
          <div className="text-label text-text-sub mb-1">총 사용자</div>
          <div className="text-display-s font-bold text-text-main">{stats.users.toLocaleString()}명</div>
        </div>

        <div className="bg-page rounded-lg p-4 border border-divider">
          <div className="text-label text-text-sub mb-1">발급된 쿠폰</div>
          <div className="text-2xl font-bold text-text-main">{stats.codes.toLocaleString()}개</div>
          <div className="text-xs text-green-600 mt-1">활성: {stats.activeCodes}개</div>
        </div>

        <div className="bg-page rounded-lg p-4 border border-divider">
          <div className="text-label text-text-sub mb-1">총 학습 콘텐츠</div>
          <div className="text-display-s font-bold text-text-main">{totalContent.toLocaleString()}개</div>
          <div className="text-label text-text-sub mt-1">단어 + 한자</div>
        </div>
      </div>
    </div>
  )
}
