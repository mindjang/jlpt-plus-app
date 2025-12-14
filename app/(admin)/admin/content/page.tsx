'use client'

import { Suspense } from 'react'
import { AdminContentManager } from '@/components/admin/AdminContentManager'

export default function AdminContentPage() {
  return (
    <>
      {/* 상단 헤더 */}
      <div className="h-14 border-b border-divider bg-surface flex items-center justify-between px-6 sticky top-0 z-30">
        <h1 className="text-title font-semibold text-text-main">콘텐츠 관리</h1>
        <div className="text-label text-text-sub hidden md:block">단어 및 한자 목록 관리</div>
      </div>

      {/* 콘텐츠 영역 */}
      <div className="h-[calc(100vh-3.5rem)] overflow-y-auto">
        <div className="p-6">
          <Suspense fallback={<div className="text-center py-12 text-body text-text-sub">로딩 중...</div>}>
            <AdminContentManager />
          </Suspense>
        </div>
      </div>
    </>
  )
}
