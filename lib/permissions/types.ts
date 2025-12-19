/**
 * 권한 관리 시스템 타입 정의
 */

import type { MembershipStatus } from '@/components/membership/MembershipProvider'

/**
 * 기능 식별자
 * 새로운 기능 추가 시 여기에 추가
 */
export type FeatureId =
  | 'study_session' // 학습 세션 시작
  | 'unlimited_sessions' // 무제한 세션
  | 'advanced_stats' // 고급 통계
  | 'stats_view' // 통계 조회 (로그인 필요)
  | 'quiz_history' // 퀴즈 히스토리 조회 (로그인 필요)
  | 'study_history' // 학습 히스토리 조회 (로그인 필요)
  | 'quiz_start' // 퀴즈 시작 (로그인 필요)
  | 'my_page' // 마이페이지 (로그인 필요)
  | 'export_data' // 데이터 내보내기
  | 'custom_settings' // 커스텀 설정
  | 'premium_quiz' // 프리미엄 퀴즈
  | 'offline_mode' // 오프라인 모드
  | 'api_access' // API 접근
  | 'priority_support' // 우선 지원

/**
 * 기능 접근 요구사항
 */
export interface FeatureRequirement {
  /**
   * 필요한 최소 멤버십 상태
   * - 'guest': 비로그인 사용자도 접근 가능
   * - 'nonMember': 로그인 필요 (멤버십 불필요)
   * - 'expired': 만료된 멤버십도 허용
   * - 'member': 활성 멤버십 필요
   */
  minStatus: MembershipStatus

  /**
   * 추가 조건 함수 (선택)
   * 예: 세션 제한 체크, 특정 설정 확인 등
   */
  customCheck?: (context: PermissionContext) => boolean

  /**
   * 기능이 제한되었을 때 표시할 메시지
   */
  restrictionMessage?: {
    title: string
    description: string
  }
}

/**
 * 권한 체크 컨텍스트
 */
export interface PermissionContext {
  status: MembershipStatus
  isMember: boolean
  canStartSession: boolean
  remainingSessions: number
  user: { uid: string } | null
  membership: {
    expiresAt: number
    type: 'monthly' | 'yearly' | 'gift'
    source: 'subscription' | 'code'
  } | null
}

/**
 * 기능 접근 결과
 */
export interface FeatureAccessResult {
  /**
   * 접근 가능 여부
   */
  allowed: boolean

  /**
   * 접근 불가 이유
   */
  reason?: 'not_logged_in' | 'membership_required' | 'session_limit' | 'custom_check_failed'

  /**
   * 제한 메시지
   */
  message?: {
    title: string
    description: string
  }
}
