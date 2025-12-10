'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { AppBar } from '@/components/ui/AppBar'
import { SearchContent } from '@/components/search/SearchContent'

export default function SearchPage() {
  const router = useRouter()

  return (
    <>
      <AppBar title="전체 검색" onBack={() => router.back()} />
      <div className="pb-20">
        <SearchContent
          routingMode="mobile"
          resetOnTabChange={true}
          showTotalCount={true}
          showBottomNav={true}
          showEmptyMessage={true}
        />
      </div>
    </>
  )
}
