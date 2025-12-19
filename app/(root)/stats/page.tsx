'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { AppBar } from '@/components/ui/AppBar'
import { motion } from 'framer-motion'
import { PeriodStats } from '@/components/stats/PeriodStats'
import { CategoryStats } from '@/components/stats/CategoryStats'
import { FeatureGuard } from '@/components/permissions/FeatureGuard'

type TabType = 'period' | 'category' | 'vocabulary'

function StatsContent() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>('period')

  return (
    <FeatureGuard
      feature="stats_view"
      customMessage={{
        title: '학습 통계',
        description: '학습 통계를 확인하려면 로그인이 필요합니다.',
      }}
    >
    <div className="w-full overflow-hidden bg-page min-h-screen">
      <AppBar title="학습 통계" onBack={() => router.back()} />

      <div className="flex flex-col gap-4 p-4 pb-20">
        {/* 메인 탭 */}
        <div className="flex gap-2 bg-surface rounded-lg border border-divider p-1">
          <button
            onClick={() => setActiveTab('period')}
            className={`flex-1 py-2 rounded-lg text-body font-medium transition-colors ${
              activeTab === 'period'
                ? 'bg-primary text-white shadow-sm'
                : 'text-text-sub active:bg-gray-50'
            }`}
          >
            기간별
          </button>
          <button
            onClick={() => setActiveTab('category')}
            className={`flex-1 py-2 rounded-lg text-body font-medium transition-colors ${
              activeTab === 'category'
                ? 'bg-primary text-white shadow-sm'
                : 'text-text-sub active:bg-gray-50'
            }`}
          >
            학습별
          </button>
        </div>

        {/* 탭 컨텐츠 */}
        {activeTab === 'period' && <PeriodStats />}
        {activeTab === 'category' && <CategoryStats />}
      </div>
    </div>
    </FeatureGuard>
  )
}

export default function StatsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-body text-text-sub">로딩 중...</div>
        </div>
      }
    >
      <StatsContent />
    </Suspense>
  )
}
