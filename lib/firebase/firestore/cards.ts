/**
 * 카드 상태 관리 (Firestore CRUD)
 */
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  writeBatch,
} from 'firebase/firestore'
import type { UserCardState } from '../../types/srs'
import type { JlptLevel } from '../../types/content'
import { getDbInstance } from './utils'

/**
 * 카드 상태 가져오기
 */
export async function getCardState(
  uid: string,
  cardId: string
): Promise<UserCardState | null> {
  const dbInstance = getDbInstance()
  const cardRef = doc(dbInstance, 'users', uid, 'cards', cardId)
  const cardSnap = await getDoc(cardRef)

  if (!cardSnap.exists()) {
    return null
  }

  return cardSnap.data() as UserCardState
}

/**
 * 카드 상태 저장/업데이트
 */
export async function saveCardState(uid: string, cardState: UserCardState) {
  const dbInstance = getDbInstance()
  const cardRef = doc(dbInstance, 'users', uid, 'cards', cardState.itemId)
  await setDoc(cardRef, cardState, { merge: true })
}

/**
 * Firestore 배치 제한 (최대 500개)
 */
const FIRESTORE_BATCH_LIMIT = 500

/**
 * 여러 카드 상태를 배치로 저장 (재시도 및 청크 분할 포함)
 * 
 * @param uid 사용자 ID
 * @param cardStates 저장할 카드 상태 배열
 * @param options 재시도 옵션
 * @returns 저장된 카드 수
 */
export async function saveCardStatesBatch(
  uid: string,
  cardStates: UserCardState[],
  options: {
    maxRetries?: number
    onProgress?: (saved: number, total: number) => void
  } = {}
): Promise<number> {
  if (cardStates.length === 0) {
    return 0
  }

  const { maxRetries = 3, onProgress } = options
  const dbInstance = getDbInstance()
  let totalSaved = 0

  // Firestore 배치 제한에 맞춰 청크로 분할
  const chunks: UserCardState[][] = []
  for (let i = 0; i < cardStates.length; i += FIRESTORE_BATCH_LIMIT) {
    chunks.push(cardStates.slice(i, i + FIRESTORE_BATCH_LIMIT))
  }

  // 각 청크를 재시도 로직과 함께 처리
  for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
    const chunk = chunks[chunkIndex]
    let saved = false
    let lastError: unknown

    // 재시도 로직
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
  const batch = writeBatch(dbInstance)

        chunk.forEach((cardState) => {
    const cardRef = doc(dbInstance, 'users', uid, 'cards', cardState.itemId)
    batch.set(cardRef, cardState, { merge: true })
  })

  await batch.commit()
        totalSaved += chunk.length
        saved = true

        // 진행 상황 콜백
        if (onProgress) {
          onProgress(totalSaved, cardStates.length)
        }

        break // 성공 시 루프 종료
      } catch (error) {
        lastError = error

        // 재시도할 수 없는 에러면 즉시 throw
        const errorMessage = error instanceof Error ? error.message.toLowerCase() : ''
        const errorCode = (error as any).code?.toLowerCase() || ''

        // 권한 오류, 잘못된 데이터 등은 재시도하지 않음
        if (
          errorCode === 'permission-denied' ||
          errorCode === 'invalid-argument' ||
          errorMessage.includes('permission')
        ) {
          throw error
        }

        // 마지막 시도면 에러 throw
        if (attempt >= maxRetries) {
          throw error
        }

        // 지수 백오프 대기 (1초, 2초, 4초...)
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000)
        await new Promise((resolve) => setTimeout(resolve, delay))

        console.warn(
          `[saveCardStatesBatch] Retry attempt ${attempt + 1}/${maxRetries} for chunk ${chunkIndex + 1}/${chunks.length}`,
          error
        )
      }
    }

    // 청크 저장 실패 시 에러 throw
    if (!saved) {
      throw lastError || new Error(`Failed to save chunk ${chunkIndex + 1}`)
    }
  }

  return totalSaved
}

/**
 * 현재 복습해야 할 카드들 가져오기 (분 단위)
 */
export async function getReviewCards(uid: string, maxCards: number = 100) {
  const dbInstance = getDbInstance()
  const nowMinutes = Math.floor(Date.now() / (1000 * 60))
  const cardsRef = collection(dbInstance, 'users', uid, 'cards')

  const q = query(
    cardsRef,
    where('due', '<=', nowMinutes),
    where('suspended', '==', false),
    orderBy('due', 'asc'),
    limit(maxCards)
  )

  const querySnapshot = await getDocs(q)
  const cards: UserCardState[] = []

  querySnapshot.forEach((doc) => {
    const card = doc.data() as UserCardState
    // 기존 일 단위 데이터 마이그레이션은 reviewCard 함수에서 처리
    // 여기서는 그대로 반환 (reviewCard 호출 시 자동 마이그레이션됨)
    cards.push(card)
  })

  return cards
}

/**
 * 특정 레벨의 카드 상태 가져오기 (페이지네이션 지원)
 * @param uid 사용자 ID
 * @param level 레벨
 * @param limitCount 최대 개수 (기본 500, 성능을 위해 제한)
 * @returns 카드 상태 Map
 */
export async function getCardsByLevel(
  uid: string,
  level: string,
  limitCount: number = 500
): Promise<Map<string, UserCardState>> {
  const dbInstance = getDbInstance()
  const cardsRef = collection(dbInstance, 'users', uid, 'cards')
  const q = query(
    cardsRef,
    where('level', '==', level),
    limit(limitCount)
  )

  const querySnapshot = await getDocs(q)
  const cardMap = new Map<string, UserCardState>()

  querySnapshot.forEach((doc) => {
    const card = doc.data() as UserCardState
    cardMap.set(card.itemId, card)
  })

  return cardMap
}

/**
 * 특정 레벨의 카드 개수 집계 (카운트만 필요할 때 사용)
 * 주의: Firestore에서 count 쿼리는 비용이 발생하므로 캐싱 권장
 */
export async function getCardsCountByLevel(
  uid: string,
  level: string
): Promise<number> {
  const dbInstance = getDbInstance()
  const cardsRef = collection(dbInstance, 'users', uid, 'cards')
  const q = query(cardsRef, where('level', '==', level))
  const querySnapshot = await getDocs(q)
  return querySnapshot.size
}

/**
 * 모든 카드 ID 가져오기 (itemId Set 반환)
 * 성능 최적화: 전체 문서 대신 문서 ID만 가져옴
 * @param uid 사용자 ID
 * @param limitCount 최대 개수 (기본 1000, 모든 카드가 필요한 경우에만 사용)
 * @returns 카드 ID Set
 */
export async function getAllCardIds(uid: string, limitCount: number = 1000): Promise<Set<string>> {
  const dbInstance = getDbInstance()
  const cardsRef = collection(dbInstance, 'users', uid, 'cards')
  const q = query(cardsRef, limit(limitCount))
  const querySnapshot = await getDocs(q)

  const cardIds = new Set<string>()

  querySnapshot.forEach((doc) => {
    cardIds.add(doc.id)
  })

  return cardIds
}

/**
 * 특정 레벨의 카드 ID만 가져오기 (최적화)
 * @param uid 사용자 ID
 * @param level 레벨
 * @param limitCount 최대 개수
 * @returns 카드 ID Set
 */
export async function getCardIdsByLevel(
  uid: string,
  level: string,
  limitCount: number = 500
): Promise<Set<string>> {
  const dbInstance = getDbInstance()
  const cardsRef = collection(dbInstance, 'users', uid, 'cards')
  const q = query(
    cardsRef,
    where('level', '==', level),
    limit(limitCount)
  )
  const querySnapshot = await getDocs(q)

  const cardIds = new Set<string>()

  querySnapshot.forEach((doc) => {
    cardIds.add(doc.id)
  })

  return cardIds
}

/**
 * 일시 중단된(Leech) 카드들 가져오기
 */
export async function getSuspendedCards(uid: string, level?: JlptLevel): Promise<UserCardState[]> {
  const dbInstance = getDbInstance()
  const cardsRef = collection(dbInstance, 'users', uid, 'cards')
  
  let q = query(
    cardsRef,
    where('suspended', '==', true),
    orderBy('lapses', 'desc'),
  )
  
  if (level) {
    q = query(q, where('level', '==', level))
  }
  
  const querySnapshot = await getDocs(q)
  const cards: UserCardState[] = []
  querySnapshot.forEach((doc) => {
    cards.push(doc.data() as UserCardState)
  })
  
  return cards
}

/**
 * Leech 카드 재활성화
 */
export async function reactivateCard(uid: string, itemId: string): Promise<void> {
  const dbInstance = getDbInstance()
  const cardRef = doc(dbInstance, 'users', uid, 'cards', itemId)
  await updateDoc(cardRef, { suspended: false })
}

