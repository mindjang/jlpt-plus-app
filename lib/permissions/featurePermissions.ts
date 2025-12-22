/**
 * 기능별 권한 정의
 * 
 * 새로운 기능 추가 시 이 파일에 권한 요구사항을 정의하세요.
 */

import type { FeatureId, FeatureRequirement, PermissionContext } from './types'

/**
 * 기능별 권한 요구사항 맵
 */
export const FEATURE_PERMISSIONS: Record<FeatureId, FeatureRequirement> = {
  /**
   * 학습 세션 시작
   * - 비회원: 하루 1회 제한
   * - 회원: 무제한
   */
  study_session: {
    minStatus: 'nonMember',
    customCheck: (context) => {
      // 로그인 필요
      if (!context.user) return false
      // 회원이면 항상 허용
      if (context.isMember) return true
      // 비회원은 세션 시작 가능 여부 확인
      return context.canStartSession
    },
    restrictionMessage: {
      title: '학습을 시작하려면 로그인이 필요합니다',
      description: '지금도 충분히 잘 하고 계세요.<br />현재는 하루 1회만 학습할 수 있어요. 회원이 되시면 오늘처럼 매일 학습할 수 있어요.',
    },
  },

  /**
   * 무제한 세션
   * - 회원 전용
   */
  unlimited_sessions: {
    minStatus: 'member',
    restrictionMessage: {
      title: '오늘처럼 매일 학습하고 싶으신가요?',
      description: '지금도 충분히 잘 하고 계세요.<br />현재는 하루 1회만 학습할 수 있어요. 회원이 되시면 복습 카드를 원하는 만큼 처리할 수 있어요.',
    },
  },

  /**
   * 고급 통계
   * - 회원 전용
   */
  advanced_stats: {
    minStatus: 'member',
    restrictionMessage: {
      title: '통계를 더 자세히 보고 싶으신가요?',
      description: '지금 보시는 통계로도 충분해요.<br />회원이 되시면 지금 보시는 통계를 더 자세히 볼 수 있어요. 레벨별 학습 진행도와 학습 데이터를 내보낼 수도 있어요.',
    },
  },

  /**
   * 통계 조회
   * - 로그인 필요 (멤버십 불필요)
   */
  stats_view: {
    minStatus: 'nonMember',
    restrictionMessage: {
      title: '로그인이 필요해요',
      description: '학습 통계를 확인하려면 로그인이 필요합니다.',
    },
  },

  /**
   * 퀴즈 히스토리 조회
   * - 로그인 필요 (멤버십 불필요)
   */
  quiz_history: {
    minStatus: 'nonMember',
    restrictionMessage: {
      title: '로그인이 필요해요',
      description: '퀴즈 기록을 확인하려면 로그인이 필요합니다.',
    },
  },

  /**
   * 학습 히스토리 조회
   * - 로그인 필요 (멤버십 불필요)
   */
  study_history: {
    minStatus: 'nonMember',
    restrictionMessage: {
      title: '로그인이 필요해요',
      description: '학습 히스토리를 확인하려면 로그인이 필요합니다.',
    },
  },

  /**
   * 퀴즈 시작
   * - 로그인 필요 (멤버십 불필요)
   */
  quiz_start: {
    minStatus: 'nonMember',
    restrictionMessage: {
      title: '로그인이 필요해요',
      description: '퀴즈를 시작하려면 로그인이 필요합니다.',
    },
  },

  /**
   * 마이페이지
   * - 로그인 필요 (멤버십 불필요)
   */
  my_page: {
    minStatus: 'nonMember',
    restrictionMessage: {
      title: '로그인이 필요해요',
      description: '마이페이지를 이용하려면 로그인이 필요합니다.',
    },
  },

  /**
   * 데이터 내보내기
   * - 회원 전용
   */
  export_data: {
    minStatus: 'member',
    restrictionMessage: {
      title: '학습 기록을 저장하고 싶으신가요?',
      description: '지금도 충분히 잘 하고 계세요.<br />회원이 되시면 학습 기록을 파일로 저장할 수 있어요. 언제든지 데이터를 가져갈 수 있어요.',
    },
  },

  /**
   * 커스텀 설정
   * - 회원 전용
   */
  custom_settings: {
    minStatus: 'member',
    restrictionMessage: {
      title: '프리미엄 회원만 이용할 수 있어요',
      description: '회원권을 등록하면 다양한 학습 설정을 커스터마이징할 수 있어요.',
    },
  },

  /**
   * 프리미엄 퀴즈
   * - 회원 전용
   */
  premium_quiz: {
    minStatus: 'member',
    restrictionMessage: {
      title: '프리미엄 회원만 이용할 수 있어요',
      description: '회원권을 등록하면 특별한 퀴즈 모드를 이용할 수 있어요.',
    },
  },

  /**
   * 오프라인 모드
   * - 회원 전용
   */
  offline_mode: {
    minStatus: 'member',
    restrictionMessage: {
      title: '프리미엄 회원만 이용할 수 있어요',
      description: '회원권을 등록하면 인터넷 없이도 학습할 수 있어요.',
    },
  },

  /**
   * API 접근
   * - 회원 전용
   */
  api_access: {
    minStatus: 'member',
    restrictionMessage: {
      title: '프리미엄 회원만 이용할 수 있어요',
      description: '회원권을 등록하면 API를 통해 데이터에 접근할 수 있어요.',
    },
  },

  /**
   * 우선 지원
   * - 회원 전용
   */
  priority_support: {
    minStatus: 'member',
    restrictionMessage: {
      title: '프리미엄 회원만 이용할 수 있어요',
      description: '회원권을 등록하면 우선 고객 지원을 받을 수 있어요.',
    },
  },
}

/**
 * 상태 우선순위 (낮을수록 제한적)
 */
const STATUS_PRIORITY: Record<string, number> = {
  guest: 0,
  nonMember: 1,
  expired: 2,
  member: 3,
}

/**
 * 상태 비교 헬퍼
 */
export function compareStatus(
  userStatus: string,
  requiredStatus: string
): boolean {
  return STATUS_PRIORITY[userStatus] >= STATUS_PRIORITY[requiredStatus]
}
