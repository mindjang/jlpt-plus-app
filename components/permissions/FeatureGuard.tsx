/**
 * 기능 접근 권한 가드 컴포넌트
 * 
 * 사용 예시:
 * <FeatureGuard feature="study_session" fallback={<PaywallOverlay />}>
 *   <StudySession />
 * </FeatureGuard>
 */

'use client'

import React, { Suspense } from 'react'
import { useFeatureAccess } from '@/lib/permissions'
import { PaywallOverlay } from '@/components/membership/PaywallOverlay'
import { LoginRequiredScreen } from '@/components/auth/LoginRequiredScreen'
import type { FeatureId } from '@/lib/permissions'

interface FeatureGuardProps {
  /**
   * 체크할 기능 ID
   */
  feature: FeatureId

  /**
   * 접근 불가 시 표시할 컴포넌트 (선택)
   * 지정하지 않으면 기본 PaywallOverlay 또는 LoginRequiredScreen 표시
   */
  fallback?: React.ReactNode

  /**
   * 접근 불가 시 표시할 커스텀 메시지 (선택)
   */
  customMessage?: {
    title?: string
    description?: string
  }

  /**
   * children을 렌더링할지 여부를 제어하는 함수 (선택)
   * true를 반환하면 children을 렌더링, false면 fallback 렌더링
   */
  renderCondition?: (allowed: boolean) => boolean

  children: React.ReactNode
}

/**
 * 기능 접근 권한 가드
 */
export function FeatureGuard({
  feature,
  fallback,
  customMessage,
  renderCondition,
  children,
}: FeatureGuardProps) {
  const access = useFeatureAccess(feature)

  // 커스텀 렌더링 조건이 있으면 사용
  const shouldRender = renderCondition
    ? renderCondition(access.allowed)
    : access.allowed

  if (shouldRender) {
    return <>{children}</>
  }

  // 커스텀 fallback이 있으면 사용
  if (fallback) {
    return <>{fallback}</>
  }

  // 기본 fallback 렌더링
  const message = customMessage || access.message

  if (access.reason === 'not_logged_in') {
    return (
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-body text-text-sub">로딩 중...</div>
          </div>
        }
      >
        <LoginRequiredScreen
          title={message?.title || '로그인이 필요해요'}
          description={message?.description || '이 기능을 사용하려면 로그인이 필요합니다.'}
        />
      </Suspense>
    )
  }

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-body text-text-sub">로딩 중...</div>
        </div>
      }
    >
      <PaywallOverlay
        title={message?.title || '프리미엄 회원만 이용할 수 있어요'}
        description={message?.description || '회원권을 등록하면 이 기능을 이용할 수 있어요.'}
      />
    </Suspense>
  )
}
