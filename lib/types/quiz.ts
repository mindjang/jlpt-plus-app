// 퀴즈 시스템 타입 정의
import type { JlptLevel } from './content'
import type { NaverWord, KanjiAliveEntry } from '@/data/types'

// 퀴즈 문제 타입
export type QuizQuestionType = 'word-to-meaning' | 'meaning-to-word' | 'sentence-fill-in'

// 퀴즈 문제
export interface QuizQuestion {
  id: string // 문제 고유 ID
  type: QuizQuestionType
  question: string // 질문 텍스트 (한자 or 뜻)
  answer: string // 정답
  options: string[] // 4지선다 보기 (정답 포함)
  itemId: string // 원본 단어/한자 ID
  itemType: 'word' | 'kanji'
  level: JlptLevel
  questionData?: NaverWord | KanjiAliveEntry // 원본 데이터 (선택적)
  sentenceJa?: string // 일본어 예문 (문장 빈칸 채우기용)
  sentenceKo?: string // 한국어 번역 (문장 빈칸 채우기용)
  blankPosition?: { start: number; end: number } // 빈칸 위치 (문장 빈칸 채우기용)
}

// 퀴즈 답안
export interface QuizAnswer {
  questionId: string
  selectedAnswer: string
  correctAnswer: string
  isCorrect: boolean
  timeSpent: number // 밀리초
  timestamp: number // epoch ms
}

// 퀴즈 세션 설정
export interface QuizSettings {
  levels: JlptLevel[] // 선택한 레벨들
  questionCount: number // 문제 수 (10/20/30 또는 커스텀)
  questionTypes: QuizQuestionType[] // 문제 유형 (빈 배열 = 혼합)
  includeWords: boolean // 단어 포함 여부
  includeKanji: boolean // 한자 포함 여부
}

// 퀴즈 세션 상태
export interface QuizSession {
  sessionId: string
  uid: string
  settings: QuizSettings
  questions: QuizQuestion[]
  answers: QuizAnswer[]
  currentQuestionIndex: number
  startTime: number // epoch ms
  endTime?: number // epoch ms
  score: number // 0-100 (백분율)
  correctCount: number
  totalQuestions: number
  expGained: number
  badgesEarned: string[]
  streakCount: number // 연속 정답 수
  maxStreak: number // 최대 연속 정답
}

// 퀴즈 결과
export interface QuizResult {
  sessionId: string
  score: number // 0-100
  correctCount: number
  totalQuestions: number
  expGained: number
  leveledUp: boolean
  newLevel?: number
  badgesEarned: string[]
  averageTimePerQuestion: number // 밀리초
  accuracy: number // 0-1
  weakPoints: Array<{
    itemId: string
    itemType: 'word' | 'kanji'
    question: string
    correctAnswer: string
    userAnswer: string
  }>
  completedAt: number // epoch ms
}

// 사용자 퀴즈 레벨
export interface UserQuizLevel {
  level: number // 현재 레벨 (1부터 시작)
  exp: number // 현재 레벨의 경험치
  totalExp: number // 누적 경험치
  expForNextLevel: number // 다음 레벨까지 필요한 경험치
  badges: string[] // 획득한 배지 ID들
  lastLevelUp: number // 마지막 레벨업 시각 (epoch ms)
  createdAt: number // 생성 시각
  updatedAt: number // 마지막 업데이트
}

// 아이템별 통계
export interface ItemStats {
  itemId: string
  itemType: 'word' | 'kanji'
  level: JlptLevel
  attempts: number // 총 시도 횟수
  correct: number // 정답 횟수
  wrong: number // 오답 횟수
  accuracy: number // 정답률 (0-1)
  lastAttempt: number // 마지막 시도 시각 (epoch ms)
  averageTimeSpent: number // 평균 소요 시간 (밀리초)
}

// 레벨별 퀴즈 통계
export interface QuizStats {
  level: JlptLevel
  totalSessions: number // 총 세션 수
  totalQuestions: number // 총 문제 수
  correctAnswers: number // 총 정답 수
  averageAccuracy: number // 평균 정답률 (0-1)
  averageScore: number // 평균 점수 (0-100)
  itemStats: Record<string, ItemStats> // itemId를 키로 하는 맵
  lastUpdated: number // epoch ms
}

// 배지 정의
export interface Badge {
  id: string
  name: string
  description: string
  icon: string // 이모지 또는 아이콘 이름
  condition: BadgeCondition
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

// 배지 조건
export type BadgeCondition =
  | { type: 'first_quiz'; count: number }
  | { type: 'perfect_score'; count: number }
  | { type: 'speed_demon'; avgTime: number }
  | { type: 'consecutive_days'; days: number }
  | { type: 'level_master'; level: JlptLevel; accuracy: number }
  | { type: 'total_exp'; exp: number }
  | { type: 'total_questions'; count: number }
  | { type: 'streak_master'; streak: number }

// 사용자 배지 진행도
export interface UserBadgeProgress {
  badgeId: string
  progress: number // 0-1
  earned: boolean
  earnedAt?: number // epoch ms
}

// 퀴즈 히스토리 요약
export interface QuizHistorySummary {
  sessionId: string
  date: number // epoch ms
  levels: JlptLevel[]
  score: number
  correctCount: number
  totalQuestions: number
  expGained: number
  duration: number // 밀리초
}

// 약점 아이템
export interface WeakItem {
  itemId: string
  itemType: 'word' | 'kanji'
  level: JlptLevel
  accuracy: number
  attempts: number
  data: NaverWord | KanjiAliveEntry
}

