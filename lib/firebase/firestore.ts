// Firestore 유틸 함수
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
import { db } from './config'
import type { UserCardState } from '../types/srs'
import type { UserProfile, UserSettings, UserData } from '../types/user'

function getDbInstance() {
  if (!db) {
    throw new Error('Firestore is not initialized')
  }
  return db
}

// ========== 유저 문서 관리 ==========

/**
 * 유저 문서 생성 (최초 로그인 시)
 */
export async function createUserDocument(
  uid: string,
  initialData?: {
    email?: string
    displayName?: string
    photoURL?: string
  }
) {
  const dbInstance = getDbInstance()
  const userRef = doc(dbInstance, 'users', uid)
  const userSnap = await getDoc(userRef)

  // 이미 존재하면 생성하지 않음
  if (userSnap.exists()) {
    return
  }

  const now = Date.now()

  const userData: UserData = {
    profile: {
      displayName: initialData?.displayName,
      createdAt: now,
      email: initialData?.email,
      photoURL: initialData?.photoURL,
    },
    settings: {
      dailyNewLimit: 10, // 기본값
      theme: 'auto',
      notifications: true,
      soundEnabled: true,
    },
  }

  await setDoc(userRef, userData)
}

/**
 * 유저 데이터 가져오기
 */
export async function getUserData(uid: string): Promise<UserData | null> {
  const dbInstance = getDbInstance()
  const userRef = doc(dbInstance, 'users', uid)
  const userSnap = await getDoc(userRef)

  if (!userSnap.exists()) {
    return null
  }

  return userSnap.data() as UserData
}

/**
 * 유저 프로필 업데이트
 */
export async function updateUserProfile(uid: string, profile: Partial<UserProfile>) {
  const dbInstance = getDbInstance()
  const userRef = doc(dbInstance, 'users', uid)
  await updateDoc(userRef, {
    'profile': profile,
  })
}

/**
 * 유저 설정 업데이트
 */
export async function updateUserSettings(uid: string, settings: Partial<UserSettings>) {
  const dbInstance = getDbInstance()
  const userRef = doc(dbInstance, 'users', uid)
  await updateDoc(userRef, {
    'settings': settings,
  })
}

// ========== 카드 상태 관리 ==========

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
 * 특정 레벨의 모든 카드 상태 가져오기
 */
export async function getCardsByLevel(
  uid: string,
  level: string
): Promise<Map<string, UserCardState>> {
  const dbInstance = getDbInstance()
  const cardsRef = collection(dbInstance, 'users', uid, 'cards')
  const q = query(cardsRef, where('level', '==', level))

  const querySnapshot = await getDocs(q)
  const cardMap = new Map<string, UserCardState>()

  querySnapshot.forEach((doc) => {
    const card = doc.data() as UserCardState
    cardMap.set(card.itemId, card)
  })

  return cardMap
}

/**
 * 모든 카드 상태 가져오기 (itemId Set 반환)
 */
export async function getAllCardIds(uid: string): Promise<Set<string>> {
  const dbInstance = getDbInstance()
  const cardsRef = collection(dbInstance, 'users', uid, 'cards')
  const querySnapshot = await getDocs(cardsRef)

  const cardIds = new Set<string>()

  querySnapshot.forEach((doc) => {
    cardIds.add(doc.id)
  })

  return cardIds
}

