/**
 * 권한 체크 로직 테스트
 */

import { checkFeatureAccess, canAccessFeature } from '../permissionChecker'
import type { PermissionContext } from '../types'

describe('checkFeatureAccess', () => {
  describe('로그인 상태별 접근 권한', () => {
    it('guest는 stats_view에 접근할 수 없어야 함', () => {
      const context: PermissionContext = {
        user: null,
        status: 'guest',
        isMember: false,
        canStartSession: false,
      }

      const result = checkFeatureAccess('stats_view', context)

      expect(result.allowed).toBe(false)
      expect(result.reason).toBe('not_logged_in')
    })

    it('nonMember는 stats_view에 접근할 수 있어야 함', () => {
      const context: PermissionContext = {
        user: { uid: 'test-uid' } as any,
        status: 'nonMember',
        isMember: false,
        canStartSession: true,
      }

      const result = checkFeatureAccess('stats_view', context)

      expect(result.allowed).toBe(true)
    })

    it('member는 advanced_stats에 접근할 수 있어야 함', () => {
      const context: PermissionContext = {
        user: { uid: 'test-uid' } as any,
        status: 'member',
        isMember: true,
        canStartSession: true,
      }

      const result = checkFeatureAccess('advanced_stats', context)

      expect(result.allowed).toBe(true)
    })

    it('nonMember는 advanced_stats에 접근할 수 없어야 함', () => {
      const context: PermissionContext = {
        user: { uid: 'test-uid' } as any,
        status: 'nonMember',
        isMember: false,
        canStartSession: true,
      }

      const result = checkFeatureAccess('advanced_stats', context)

      expect(result.allowed).toBe(false)
      expect(result.reason).toBe('membership_required')
    })
  })

  describe('study_session 커스텀 체크', () => {
    it('회원은 항상 학습 세션을 시작할 수 있어야 함', () => {
      const context: PermissionContext = {
        user: { uid: 'test-uid' } as any,
        status: 'member',
        isMember: true,
        canStartSession: false, // canStartSession이 false여도 회원은 가능
      }

      const result = checkFeatureAccess('study_session', context)

      expect(result.allowed).toBe(true)
    })

    it('비회원은 canStartSession이 true일 때만 학습 세션을 시작할 수 있어야 함', () => {
      const context: PermissionContext = {
        user: { uid: 'test-uid' } as any,
        status: 'nonMember',
        isMember: false,
        canStartSession: true,
      }

      const result = checkFeatureAccess('study_session', context)

      expect(result.allowed).toBe(true)
    })

    it('비회원은 canStartSession이 false일 때 학습 세션을 시작할 수 없어야 함', () => {
      const context: PermissionContext = {
        user: { uid: 'test-uid' } as any,
        status: 'nonMember',
        isMember: false,
        canStartSession: false,
      }

      const result = checkFeatureAccess('study_session', context)

      expect(result.allowed).toBe(false)
      expect(result.reason).toBe('custom_check_failed')
    })

    it('guest는 학습 세션을 시작할 수 없어야 함', () => {
      const context: PermissionContext = {
        user: null,
        status: 'guest',
        isMember: false,
        canStartSession: false,
      }

      const result = checkFeatureAccess('study_session', context)

      expect(result.allowed).toBe(false)
      expect(result.reason).toBe('not_logged_in')
    })
  })

  describe('정의되지 않은 기능', () => {
    it('정의되지 않은 기능은 접근할 수 없어야 함', () => {
      const context: PermissionContext = {
        user: { uid: 'test-uid' } as any,
        status: 'member',
        isMember: true,
        canStartSession: true,
      }

      const result = checkFeatureAccess('unknown_feature' as any, context)

      expect(result.allowed).toBe(false)
      expect(result.reason).toBe('custom_check_failed')
    })
  })
})

describe('canAccessFeature', () => {
  it('allowed가 true면 true를 반환해야 함', () => {
    const context: PermissionContext = {
      user: { uid: 'test-uid' } as any,
      status: 'member',
      isMember: true,
      canStartSession: true,
    }

    const result = canAccessFeature('advanced_stats', context)

    expect(result).toBe(true)
  })

  it('allowed가 false면 false를 반환해야 함', () => {
    const context: PermissionContext = {
      user: null,
      status: 'guest',
      isMember: false,
      canStartSession: false,
    }

    const result = canAccessFeature('stats_view', context)

    expect(result).toBe(false)
  })
})
