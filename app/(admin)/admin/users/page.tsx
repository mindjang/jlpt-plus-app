'use client'

import { AdminUsers } from '@/components/admin/AdminUsers'

export default function AdminUsersPage() {
  return (
    <>
      {/* 상단 헤더 */}
      <div className="h-14 border-b border-divider bg-surface flex items-center justify-between px-6 sticky top-0 z-30">
        <h1 className="text-title font-semibold text-text-main">사용자 관리</h1>
        <div className="text-label text-text-sub hidden md:block">사용자 목록 및 권한 관리</div>
      </div>

      {/* 콘텐츠 영역 */}
      <div className="h-[calc(100vh-3.5rem)] overflow-y-auto">
        <div className="p-6">
          <AdminUsers />
        </div>
      </div>
    </>
  )
}
