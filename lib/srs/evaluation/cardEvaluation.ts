/**
 * 카드 평가 및 상태 업데이트 로직
 * 모든 학습 모드(단어, 한자, 도서관, 퀴즈존)에서 재사용 가능
 */
import type { UserCardState, ReviewParams, Grade, StudyCard } from '../../types/srs'
import type { EvaluationResult } from '../../types/study'
import { reviewCard } from '../core/reviewCard'
import { saveCardState, saveCardStatesBatch } from '../../firebase/firestore'

/**
 * 카드 평가 처리
 * @param card 현재 카드
 * @param grade 평가 등급 (again, hard, good, easy)
 * @returns 업데이트된 카드 상태와 다음 복습 간격
 */
export function evaluateCard(
  card: StudyCard,
  grade: Grade
): EvaluationResult {
  const updatedState = reviewCard(card.cardState, {
    itemId: card.itemId,
    type: card.type,
    level: card.level,
    grade,
  })

  return {
    updatedState,
    nextReviewInterval: updatedState.interval,
  }
}

/**
 * 카드 평가 후 큐 업데이트
 * "다시 학습" (again)인 경우 큐에 랜덤 위치로 재삽입
 * @param queue 현재 큐
 * @param currentIndex 현재 카드 인덱스
 * @param card 현재 카드
 * @param updatedState 업데이트된 카드 상태
 * @param grade 평가 등급
 * @returns 업데이트된 큐와 다음 인덱스
 */
export function updateQueueAfterEvaluation(
  queue: StudyCard[],
  currentIndex: number,
  card: StudyCard,
  updatedState: UserCardState,
  grade: Grade
): { updatedQueue: StudyCard[]; nextIndex: number } {
  if (grade === 'again') {
    // 현재 카드를 큐에서 제거하고 랜덤 위치에 재삽입
    const newQueue = [...queue]
    newQueue.splice(currentIndex, 1)

    // 랜덤 위치 계산 (큐의 어느 위치든 가능)
    const randomIndex = Math.floor(Math.random() * (newQueue.length + 1))

    // 업데이트된 카드 상태로 재삽입
    const updatedCard: StudyCard = {
      ...card,
      cardState: updatedState,
    }
    newQueue.splice(randomIndex, 0, updatedCard)

    // 다음 카드 인덱스 계산
    const nextIndex = currentIndex < newQueue.length ? currentIndex : newQueue.length - 1

    return {
      updatedQueue: newQueue,
      nextIndex,
    }
  } else {
    // "알고있음" 등 다른 경우는 큐에서 제거하고 다음 카드로 이동
    const newQueue = [...queue]
    newQueue.splice(currentIndex, 1)

    return {
      updatedQueue: newQueue,
      nextIndex: currentIndex < newQueue.length ? currentIndex : newQueue.length,
    }
  }
}

/**
 * 카드 상태를 Firestore에 저장 (즉시 저장)
 * @param uid 사용자 ID
 * @param cardState 카드 상태
 */
export async function saveCardStateImmediate(
  uid: string,
  cardState: UserCardState
): Promise<void> {
  await saveCardState(uid, cardState)
}

/**
 * 카드 상태를 배치 업데이트 맵에 추가
 * @param pendingUpdates 현재 배치 업데이트 맵
 * @param cardState 카드 상태
 * @returns 업데이트된 맵
 */
export function addToPendingUpdates(
  pendingUpdates: Map<string, UserCardState>,
  cardState: UserCardState
): Map<string, UserCardState> {
  const next = new Map(pendingUpdates)
  next.set(cardState.itemId, cardState)
  return next
}

/**
 * 배치 업데이트를 Firestore에 저장
 * @param uid 사용자 ID
 * @param pendingUpdates 배치 업데이트 맵
 * @returns 빈 맵 (저장 후 초기화)
 */
export async function savePendingUpdates(
  uid: string,
  pendingUpdates: Map<string, UserCardState>
): Promise<Map<string, UserCardState>> {
  if (pendingUpdates.size > 0) {
    const updates = Array.from(pendingUpdates.values())
    await saveCardStatesBatch(uid, updates)
  }
  return new Map()
}

