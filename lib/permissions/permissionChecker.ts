/**
 * 권한 체크 로직
 */

import type { FeatureId, PermissionContext, FeatureAccessResult } from './types'
import { FEATURE_PERMISSIONS, compareStatus } from './featurePermissions'

/**
 * 기능 접근 권한 체크
 */
export function checkFeatureAccess(
  featureId: FeatureId,
  context: PermissionContext
): FeatureAccessResult {
  const requirement = FEATURE_PERMISSIONS[featureId]

  if (!requirement) {
    // 정의되지 않은 기능은 기본적으로 거부
    return {
      allowed: false,
      reason: 'custom_check_failed',
      message: {
        title: '알 수 없는 기능',
        description: '이 기능은 아직 사용할 수 없습니다.',
      },
    }
  }

  // 1. 최소 상태 체크
  if (!compareStatus(context.status, requirement.minStatus)) {
    let reason: FeatureAccessResult['reason'] = 'membership_required'
    if (context.status === 'guest') {
      reason = 'not_logged_in'
    }

    return {
      allowed: false,
      reason,
      message: requirement.restrictionMessage,
    }
  }

  // 2. 커스텀 체크 (있는 경우)
  if (requirement.customCheck) {
    const customResult = requirement.customCheck(context)
    if (!customResult) {
      return {
        allowed: false,
        reason: 'custom_check_failed',
        message: requirement.restrictionMessage,
      }
    }
  }

  // 모든 체크 통과
  return {
    allowed: true,
  }
}

/**
 * 여러 기능의 접근 권한을 한 번에 체크
 */
export function checkMultipleFeatures(
  featureIds: FeatureId[],
  context: PermissionContext
): Record<FeatureId, FeatureAccessResult> {
  const results: Record<string, FeatureAccessResult> = {}

  for (const featureId of featureIds) {
    results[featureId] = checkFeatureAccess(featureId, context)
  }

  return results as Record<FeatureId, FeatureAccessResult>
}

/**
 * 기능 접근 가능 여부만 간단히 확인
 */
export function canAccessFeature(
  featureId: FeatureId,
  context: PermissionContext
): boolean {
  return checkFeatureAccess(featureId, context).allowed
}
