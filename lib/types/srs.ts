// SRS 관련 타입 정의
import type { JlptLevel } from './content'
import type { KanjiAliveEntry, NaverWord } from '@/data/types'

export type CardType = 'word' | 'kanji'

export type Grade = 'again' | 'hard' | 'good' | 'easy'

export interface UserCardState {
  itemId: string // = doc ID와 동일 (중복 저장)
  type: CardType // "word" | "kanji"
  level: JlptLevel // "N5" 등

  reps: number // 지금까지 복습 횟수
  lapses: number // 틀려서 리셋된 횟수

  interval: number // 다음 복습까지의 간격 (분 단위)
  ease: number // 난이도 계수 (기본 2.5, 최소 1.3 정도)
  due: number // 다음 복습 예정 시각 (분 단위 정수, epoch 분)
  lastReviewed: number // 마지막 복습 시각 (분 단위 정수, epoch 분)

  suspended?: boolean // leech일 때 숨김 여부
}

// 카드 상태 판정 타입
export type CardStatus = 'new' | 'learning' | 'review' | 'mastered' | 'leech'

// 리뷰 파라미터
export interface ReviewParams {
  itemId: string
  type: CardType
  level: JlptLevel
  grade: Grade
}

// 학습 카드 (studyQueue.ts에서 이동)
export interface StudyCard {
  itemId: string
  type: 'word' | 'kanji'
  level: JlptLevel
  data: NaverWord | KanjiAliveEntry
  cardState: UserCardState | null // null이면 New 카드
}

// 학습 큐 (studyQueue.ts에서 이동)
export interface StudyQueue {
  reviewCards: StudyCard[]
  newCards: StudyCard[]
  mixedQueue: StudyCard[] // Anki 기본 순서: 복습(기한순) → 새 카드
}

