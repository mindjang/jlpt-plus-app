/**
 * 퀴즈 배지 시스템
 */
import type { Badge, BadgeCondition, QuizSession, UserQuizLevel } from '@/lib/types/quiz'
import type { JlptLevel } from '@/lib/types/content'

/**
 * 모든 배지 정의
 */
export const ALL_BADGES: Badge[] = [
  // 시작 배지
  {
    id: 'first_steps',
    name: '첫 걸음',
    description: '첫 퀴즈 완료',
    icon: '👣',
    condition: { type: 'first_quiz', count: 1 },
    rarity: 'common',
  },
  {
    id: 'quiz_starter',
    name: '퀴즈 입문',
    description: '퀴즈 10회 완료',
    icon: '🎯',
    condition: { type: 'first_quiz', count: 10 },
    rarity: 'common',
  },
  {
    id: 'quiz_enthusiast',
    name: '퀴즈 애호가',
    description: '퀴즈 50회 완료',
    icon: '🎪',
    condition: { type: 'first_quiz', count: 50 },
    rarity: 'rare',
  },
  {
    id: 'quiz_master',
    name: '퀴즈 마스터',
    description: '퀴즈 100회 완료',
    icon: '👑',
    condition: { type: 'first_quiz', count: 100 },
    rarity: 'epic',
  },

  // 완벽한 점수
  {
    id: 'perfect_score',
    name: '완벽주의자',
    description: '만점 달성',
    icon: '💯',
    condition: { type: 'perfect_score', count: 1 },
    rarity: 'rare',
  },
  {
    id: 'perfect_five',
    name: '완벽의 달인',
    description: '만점 5회 달성',
    icon: '⭐',
    condition: { type: 'perfect_score', count: 5 },
    rarity: 'epic',
  },

  // 속도
  {
    id: 'speed_demon',
    name: '번개같은',
    description: '평균 3초 이내 답변 (10문제 이상)',
    icon: '⚡',
    condition: { type: 'speed_demon', avgTime: 3000 },
    rarity: 'epic',
  },

  // 연속 학습
  {
    id: 'dedicated_3',
    name: '꾸준함',
    description: '3일 연속 퀴즈',
    icon: '🔥',
    condition: { type: 'consecutive_days', days: 3 },
    rarity: 'common',
  },
  {
    id: 'dedicated_7',
    name: '일주일 챔피언',
    description: '7일 연속 퀴즈',
    icon: '🏆',
    condition: { type: 'consecutive_days', days: 7 },
    rarity: 'rare',
  },
  {
    id: 'dedicated_30',
    name: '한 달 챌린저',
    description: '30일 연속 퀴즈',
    icon: '🎖️',
    condition: { type: 'consecutive_days', days: 30 },
    rarity: 'legendary',
  },

  // 레벨별 마스터
  {
    id: 'master_n5',
    name: 'N5 마스터',
    description: 'N5 문제 90% 이상 정답률 (20문제 이상)',
    icon: '🌟',
    condition: { type: 'level_master', level: 'N5', accuracy: 0.9 },
    rarity: 'rare',
  },
  {
    id: 'master_n4',
    name: 'N4 마스터',
    description: 'N4 문제 90% 이상 정답률 (20문제 이상)',
    icon: '💫',
    condition: { type: 'level_master', level: 'N4', accuracy: 0.9 },
    rarity: 'rare',
  },
  {
    id: 'master_n3',
    name: 'N3 마스터',
    description: 'N3 문제 90% 이상 정답률 (20문제 이상)',
    icon: '✨',
    condition: { type: 'level_master', level: 'N3', accuracy: 0.9 },
    rarity: 'epic',
  },
  {
    id: 'master_n2',
    name: 'N2 마스터',
    description: 'N2 문제 90% 이상 정답률 (20문제 이상)',
    icon: '🌠',
    condition: { type: 'level_master', level: 'N2', accuracy: 0.9 },
    rarity: 'epic',
  },
  {
    id: 'master_n1',
    name: 'N1 마스터',
    description: 'N1 문제 90% 이상 정답률 (20문제 이상)',
    icon: '🏅',
    condition: { type: 'level_master', level: 'N1', accuracy: 0.9 },
    rarity: 'legendary',
  },

  // 경험치 마일스톤
  {
    id: 'exp_1000',
    name: '경험 누적',
    description: '총 경험치 1,000',
    icon: '📊',
    condition: { type: 'total_exp', exp: 1000 },
    rarity: 'common',
  },
  {
    id: 'exp_5000',
    name: '경험 풍부',
    description: '총 경험치 5,000',
    icon: '📈',
    condition: { type: 'total_exp', exp: 5000 },
    rarity: 'rare',
  },
  {
    id: 'exp_10000',
    name: '경험 마스터',
    description: '총 경험치 10,000',
    icon: '💎',
    condition: { type: 'total_exp', exp: 10000 },
    rarity: 'epic',
  },

  // 문제 수
  {
    id: 'questions_100',
    name: '백문백답',
    description: '총 100문제 도전',
    icon: '📚',
    condition: { type: 'total_questions', count: 100 },
    rarity: 'common',
  },
  {
    id: 'questions_500',
    name: '500문제의 여정',
    description: '총 500문제 도전',
    icon: '📖',
    condition: { type: 'total_questions', count: 500 },
    rarity: 'rare',
  },
  {
    id: 'questions_1000',
    name: '천문제 돌파',
    description: '총 1,000문제 도전',
    icon: '📕',
    condition: { type: 'total_questions', count: 1000 },
    rarity: 'epic',
  },

  // 연속 정답
  {
    id: 'streak_10',
    name: '연속 10',
    description: '10문제 연속 정답',
    icon: '🎯',
    condition: { type: 'streak_master', streak: 10 },
    rarity: 'rare',
  },
  {
    id: 'streak_20',
    name: '연속 20',
    description: '20문제 연속 정답',
    icon: '🎪',
    condition: { type: 'streak_master', streak: 20 },
    rarity: 'epic',
  },
  {
    id: 'streak_30',
    name: '완벽한 집중',
    description: '30문제 연속 정답',
    icon: '🏆',
    condition: { type: 'streak_master', streak: 30 },
    rarity: 'legendary',
  },
]

/**
 * 세션 완료 후 새로 획득한 배지 확인
 */
export function checkNewBadges(
  session: QuizSession,
  userLevel: UserQuizLevel,
  totalSessionsCompleted: number,
  totalQuestionsAnswered: number,
  consecutiveDays: number,
  levelStats: Record<JlptLevel, { correct: number; total: number; accuracy: number }>
): string[] {
  const newBadges: string[] = []
  const currentBadges = userLevel.badges

  for (const badge of ALL_BADGES) {
    // 이미 획득한 배지는 제외
    if (currentBadges.includes(badge.id)) {
      continue
    }

    // 조건 확인
    if (checkBadgeCondition(badge.condition, {
      session,
      userLevel,
      totalSessionsCompleted,
      totalQuestionsAnswered,
      consecutiveDays,
      levelStats,
    })) {
      newBadges.push(badge.id)
    }
  }

  return newBadges
}

/**
 * 배지 조건 확인
 */
function checkBadgeCondition(
  condition: BadgeCondition,
  context: {
    session: QuizSession
    userLevel: UserQuizLevel
    totalSessionsCompleted: number
    totalQuestionsAnswered: number
    consecutiveDays: number
    levelStats: Record<JlptLevel, { correct: number; total: number; accuracy: number }>
  }
): boolean {
  const { session, userLevel, totalSessionsCompleted, totalQuestionsAnswered, consecutiveDays, levelStats } = context

  switch (condition.type) {
    case 'first_quiz':
      return totalSessionsCompleted >= condition.count

    case 'perfect_score':
      // 세션 완료된 것 중 만점인 경우를 카운트해야 하는데, 여기서는 현재 세션만 확인
      // 실제로는 히스토리에서 만점 횟수를 세어야 함
      return session.score === 100

    case 'speed_demon':
      if (session.totalQuestions < 10) return false
      const avgTime = session.answers.reduce((sum, a) => sum + a.timeSpent, 0) / session.answers.length
      return avgTime <= condition.avgTime

    case 'consecutive_days':
      return consecutiveDays >= condition.days

    case 'level_master':
      const levelStat = levelStats[condition.level]
      return levelStat && levelStat.total >= 20 && levelStat.accuracy >= condition.accuracy

    case 'total_exp':
      return userLevel.totalExp >= condition.exp

    case 'total_questions':
      return totalQuestionsAnswered >= condition.count

    case 'streak_master':
      return session.maxStreak >= condition.streak

    default:
      return false
  }
}

/**
 * 배지 정보 가져오기
 */
export function getBadgeById(badgeId: string): Badge | undefined {
  return ALL_BADGES.find((badge) => badge.id === badgeId)
}

/**
 * 배지 진행도 계산
 */
export function calculateBadgeProgress(
  badge: Badge,
  context: {
    userLevel: UserQuizLevel
    totalSessionsCompleted: number
    totalQuestionsAnswered: number
    consecutiveDays: number
    levelStats: Record<JlptLevel, { correct: number; total: number; accuracy: number }>
  }
): number {
  const { userLevel, totalSessionsCompleted, totalQuestionsAnswered, consecutiveDays, levelStats } = context
  const condition = badge.condition

  switch (condition.type) {
    case 'first_quiz':
      return Math.min(1, totalSessionsCompleted / condition.count)

    case 'consecutive_days':
      return Math.min(1, consecutiveDays / condition.days)

    case 'total_exp':
      return Math.min(1, userLevel.totalExp / condition.exp)

    case 'total_questions':
      return Math.min(1, totalQuestionsAnswered / condition.count)

    case 'level_master':
      const levelStat = levelStats[condition.level]
      if (!levelStat) return 0
      const questionsProgress = Math.min(1, levelStat.total / 20)
      const accuracyProgress = levelStat.accuracy / condition.accuracy
      return Math.min(1, (questionsProgress + accuracyProgress) / 2)

    default:
      return 0
  }
}

