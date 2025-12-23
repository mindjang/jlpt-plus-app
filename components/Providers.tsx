'use client'

import { ReactNode } from 'react'
import { AuthProvider, useAuth } from '@/components/auth/AuthProvider'
import { MembershipProvider } from '@/components/membership/MembershipProvider'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { BrandLoader } from '@/components/ui/BrandLoader'

/**
 * 인증 로딩 중 브랜드 로더 표시
 */
function AuthLoaderWrapper({ children }: { children: ReactNode }) {
  const { loading } = useAuth()

  if (loading) {
    return <BrandLoader fullScreen text="로그인 정보 확인 중..." />
  }

  return <>{children}</>
}

/**
 * 전역 Provider 래퍼
 * Auth, Membership, ErrorBoundary를 한 곳에서 관리
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AuthLoaderWrapper>
          <MembershipProvider>
            {children}
          </MembershipProvider>
        </AuthLoaderWrapper>
      </AuthProvider>
    </ErrorBoundary>
  )
}
