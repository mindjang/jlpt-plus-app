'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import { BrandLoader } from '@/components/ui/BrandLoader'

/**
 * 루트 페이지
 * 로그인 상태에 따라 적절한 페이지로 리다이렉트
 */
export default function RootPage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    // 로딩 중이면 대기
    if (loading) return

    // 로그인된 사용자는 홈으로, 비로그인 사용자는 로그인 페이지로
    if (user) {
      router.replace('/home')
    } else {
      router.replace('/login?next=/home')
    }
  }, [user, loading, router])

  // 로딩 중에는 브랜드 로더 표시
  return <BrandLoader fullScreen text="로그인 정보 확인 중..." />
}

