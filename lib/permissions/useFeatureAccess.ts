/**
 * 기능 접근 권한 체크 React Hook
 */

import { useMemo } from 'react'
import { useMembership } from '@/components/membership/MembershipProvider'
import { useAuth } from '@/components/auth/AuthProvider'
import type { FeatureId, PermissionContext, FeatureAccessResult } from './types'
import { checkFeatureAccess, canAccessFeature } from './permissionChecker'

/**
 * 단일 기능 접근 권한 체크
 */
export function useFeatureAccess(featureId: FeatureId): FeatureAccessResult {
  const { user } = useAuth()
  const {
    status,
    isMember,
    canStartSession,
    remainingSessions,
    membership,
  } = useMembership()

  const context: PermissionContext = useMemo(
    () => ({
      status,
      isMember,
      canStartSession,
      remainingSessions,
      user: user ? { uid: user.uid } : null,
      membership: membership
        ? {
            expiresAt: membership.expiresAt,
            type: membership.type,
            source: membership.source,
          }
        : null,
    }),
    [status, isMember, canStartSession, remainingSessions, user, membership]
  )

  return useMemo(
    () => checkFeatureAccess(featureId, context),
    [featureId, context]
  )
}

/**
 * 여러 기능 접근 권한 체크
 */
export function useMultipleFeatureAccess(
  featureIds: FeatureId[]
): Record<FeatureId, FeatureAccessResult> {
  const { user } = useAuth()
  const {
    status,
    isMember,
    canStartSession,
    remainingSessions,
    membership,
  } = useMembership()

  const context: PermissionContext = useMemo(
    () => ({
      status,
      isMember,
      canStartSession,
      remainingSessions,
      user: user ? { uid: user.uid } : null,
      membership: membership
        ? {
            expiresAt: membership.expiresAt,
            type: membership.type,
            source: membership.source,
          }
        : null,
    }),
    [status, isMember, canStartSession, remainingSessions, user, membership]
  )

  return useMemo(() => {
    const results: Record<string, FeatureAccessResult> = {}
    for (const featureId of featureIds) {
      results[featureId] = checkFeatureAccess(featureId, context)
    }
    return results as Record<FeatureId, FeatureAccessResult>
  }, [featureIds, context])
}

/**
 * 기능 접근 가능 여부만 간단히 확인
 */
export function useCanAccessFeature(featureId: FeatureId): boolean {
  const access = useFeatureAccess(featureId)
  return access.allowed
}
