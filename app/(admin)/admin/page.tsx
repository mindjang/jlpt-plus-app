'use client'

import React from 'react'
import { AppBar } from '@/components/ui/AppBar'

export default function AdminPage() {
  return (
    <>
      <AppBar title="관리자 대시보드" />

      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-title font-semibold text-text-main mb-6">
            관리자 페이지
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 관리자 카드들 */}
            <div className="bg-surface rounded-card p-6 shadow-soft">
              <h3 className="text-subtitle font-semibold text-text-main mb-2">
                사용자 관리
              </h3>
              <p className="text-body text-text-sub">
                사용자 목록 및 권한 관리
              </p>
            </div>

            <div className="bg-surface rounded-card p-6 shadow-soft">
              <h3 className="text-subtitle font-semibold text-text-main mb-2">
                콘텐츠 관리
              </h3>
              <p className="text-body text-text-sub">
                단어, 한자, 예문 관리
              </p>
            </div>

            <div className="bg-surface rounded-card p-6 shadow-soft">
              <h3 className="text-subtitle font-semibold text-text-main mb-2">
                통계 분석
              </h3>
              <p className="text-body text-text-sub">
                학습 통계 및 분석
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

