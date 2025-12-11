'use client'

import { ReactNode } from 'react'
import { AuthProvider } from '@/components/auth/AuthProvider'
import { MembershipProvider } from '@/components/membership/MembershipProvider'
import { ErrorBoundary } from '@/components/ErrorBoundary'

/**
 * 전역 Provider 래퍼
 * Auth, Membership, ErrorBoundary를 한 곳에서 관리
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <MembershipProvider>
          {children}
        </MembershipProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}
