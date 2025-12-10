'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { AppBar } from '@/components/ui/AppBar'
import { SearchContent } from '@/components/search/SearchContent'

export default function SearchPage() {
  const router = useRouter()

  return (
    <div className="w-full">
      <AppBar title="검색" onBack={() => router.back()} />
      <SearchContent routingMode="root" />
    </div>
  )
}

