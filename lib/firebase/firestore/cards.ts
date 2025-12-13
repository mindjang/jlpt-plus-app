/**
 * 카드 상태 관리 (Firestore CRUD)
 */
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  writeBatch,
} from 'firebase/firestore'
import type { UserCardState } from '../../types/srs'
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
 * 여러 카드 상태를 배치로 저장
 */
export async function saveCardStatesBatch(uid: string, cardStates: UserCardState[]) {
  const dbInstance = getDbInstance()
  const batch = writeBatch(dbInstance)

  cardStates.forEach((cardState) => {
    const cardRef = doc(dbInstance, 'users', uid, 'cards', cardState.itemId)
    batch.set(cardRef, cardState, { merge: true })
  })

  await batch.commit()
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

