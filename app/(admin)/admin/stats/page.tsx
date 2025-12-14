'use client'

import { AdminStats } from '@/components/admin/AdminStats'

export default function AdminStatsPage() {
  return (
    <>
      {/* 상단 헤더 */}
      <div className="h-14 border-b border-divider bg-surface flex items-center justify-between px-6 sticky top-0 z-30">
        <h1 className="text-title font-semibold text-text-main">통계 분석</h1>
        <div className="text-label text-text-sub hidden md:block">학습 통계 및 분석</div>
      </div>

      {/* 콘텐츠 영역 */}
      <div className="h-[calc(100vh-3.5rem)] overflow-y-auto">
        <div className="p-6">
          <AdminStats />
        </div>
      </div>
    </>
  )
}
