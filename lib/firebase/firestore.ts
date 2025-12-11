// Firestore 유틸 함수
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  updateDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  writeBatch,
  runTransaction,
  type Firestore,
} from 'firebase/firestore'
import { db } from './config'
import type { UserCardState } from '../types/srs'
import type { UserProfile, UserSettings, UserData } from '../types/user'
import type { Membership, DailyUsage, GiftCode, BillingInfo } from '../types/membership'

function getDbInstance() {
  if (!db) {
    throw new Error('Firestore is not initialized')
  }
  return db
}

function formatDateKey(date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
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
      dailyNewLimit: 20, // 기본값
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
  await setDoc(
    userRef,
    {
      profile,
    },
    { merge: true }
  )
}

/**
 * 유저 설정 업데이트
 */
export async function updateUserSettings(uid: string, settings: Partial<UserSettings>) {
  const dbInstance = getDbInstance()
  const userRef = doc(dbInstance, 'users', uid)
  await setDoc(
    userRef,
    {
      settings,
    },
    { merge: true }
  )
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

// ========== 멤버십 관리 ==========

const membershipDocRef = (dbInstance: Firestore, uid: string) =>
  doc(dbInstance, 'users', uid, 'membership', 'info')

const usageDocRef = (dbInstance: Firestore, uid: string, dateKey: string) =>
  doc(dbInstance, 'users', uid, 'usage', dateKey)

const billingDocRef = (dbInstance: Firestore, uid: string) =>
  doc(dbInstance, 'users', uid, 'billing', 'info')

const codeDocRef = (dbInstance: Firestore, code: string) => doc(dbInstance, 'codes', code)

export async function getMembership(uid: string): Promise<Membership | null> {
  const dbInstance = getDbInstance()
  const ref = membershipDocRef(dbInstance, uid)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  return snap.data() as Membership
}

export async function saveMembership(uid: string, membership: Membership) {
  const dbInstance = getDbInstance()
  const ref = membershipDocRef(dbInstance, uid)
  await setDoc(ref, membership, { merge: true })
}

export async function getDailyUsage(
  uid: string,
  dateKey: string = formatDateKey()
): Promise<DailyUsage | null> {
  const dbInstance = getDbInstance()
  const ref = usageDocRef(dbInstance, uid, dateKey)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  return snap.data() as DailyUsage
}

export async function incrementDailySession(
  uid: string,
  dateKey: string = formatDateKey()
): Promise<DailyUsage> {
  const dbInstance = getDbInstance()
  const ref = usageDocRef(dbInstance, uid, dateKey)
  const now = Date.now()

  const usage = await runTransaction(dbInstance, async (tx) => {
    const snap = await tx.get(ref)
    const current = snap.exists() ? (snap.data() as DailyUsage) : { sessionsUsed: 0, dateKey }
    const next: DailyUsage = {
      dateKey,
      sessionsUsed: current.sessionsUsed + 1,
      updatedAt: now,
    }
    tx.set(ref, next, { merge: true })
    return next
  })

  return usage
}

export async function redeemGiftCode(
  uid: string,
  code: string
): Promise<{ membership: Membership; code: GiftCode }> {
  const dbInstance = getDbInstance()
  const mRef = membershipDocRef(dbInstance, uid)
  // 코드 정규화: 하이픈 제거 및 대문자 변환 (createGiftCode와 동일하게 처리)
  const normalizedCode = code.toUpperCase().replace(/-/g, '')
  const cRef = codeDocRef(dbInstance, normalizedCode)
  const now = Date.now()

  const result = await runTransaction(dbInstance, async (tx) => {
    const codeSnap = await tx.get(cRef)
    if (!codeSnap.exists()) {
      throw new Error('코드가 존재하지 않습니다.')
    }
    const codeData = codeSnap.data() as GiftCode
    if (codeData.remainingUses !== undefined && codeData.remainingUses !== null) {
      if (codeData.remainingUses <= 0) {
        throw new Error('사용 가능한 횟수가 없습니다.')
      }
    }

    const membershipSnap = await tx.get(mRef)
    const current = membershipSnap.exists() ? (membershipSnap.data() as Membership) : null

    const baseTime = current?.expiresAt && current.expiresAt > now ? current.expiresAt : now
    const durationMs = codeData.durationDays * 24 * 60 * 60 * 1000
    const newExpiry = baseTime + durationMs

    const updatedMembership: Membership = {
      type: codeData.type || current?.type || 'gift',
      source: 'code',
      expiresAt: newExpiry,
      createdAt: current?.createdAt || now,
      updatedAt: now,
      lastRedeemedCode: normalizedCode,
    }

    tx.set(mRef, updatedMembership, { merge: true })

    if (codeData.remainingUses !== undefined && codeData.remainingUses !== null) {
      tx.update(cRef, { remainingUses: codeData.remainingUses - 1 })
    }

    return { membership: updatedMembership, code: codeData }
  })

  return result
}

export async function saveBillingInfo(uid: string, billing: BillingInfo) {
  const dbInstance = getDbInstance()
  const ref = billingDocRef(dbInstance, uid)
  await setDoc(ref, billing, { merge: true })
}

export async function getBillingInfo(uid: string): Promise<BillingInfo | null> {
  const dbInstance = getDbInstance()
  const ref = billingDocRef(dbInstance, uid)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  return snap.data() as BillingInfo
}

// ==================== Gift Code Management ====================

/**
 * 쿠폰 코드 생성
 * @param code 코드 문자열 (8자리)
 * @param giftCode 코드 정보
 * @throws 코드가 이미 존재하는 경우 에러
 */
export async function createGiftCode(code: string, giftCode: GiftCode): Promise<void> {
  const dbInstance = getDbInstance()
  const ref = codeDocRef(dbInstance, code.toUpperCase().replace(/-/g, ''))

  // 코드 중복 체크
  const existing = await getDoc(ref)
  if (existing.exists()) {
    throw new Error('이미 존재하는 코드입니다.')
  }

  await setDoc(ref, {
    ...giftCode,
    createdAt: Date.now(),
  })
}

/**
 * 모든 쿠폰 코드 목록 조회
 * @returns 코드 목록 (코드 문자열과 정보를 포함한 객체 배열)
 */
export async function getAllGiftCodes(): Promise<Array<{ code: string; data: GiftCode & { createdAt?: number } }>> {
  const dbInstance = getDbInstance()
  const codesRef = collection(dbInstance, 'codes')
  const q = query(codesRef, orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(q)

  const codes: Array<{ code: string; data: GiftCode & { createdAt?: number } }> = []
  snapshot.forEach((doc) => {
    codes.push({
      code: doc.id,
      data: doc.data() as GiftCode & { createdAt?: number },
    })
  })

  return codes
}

/**
 * 쿠폰 코드 정보 수정
 * @param code 코드 문자열
 * @param updates 수정할 필드들
 */
export async function updateGiftCode(code: string, updates: Partial<GiftCode>): Promise<void> {
  const dbInstance = getDbInstance()
  // 코드 정규화: 하이픈 제거 및 대문자 변환
  const normalizedCode = code.toUpperCase().replace(/-/g, '')
  const ref = codeDocRef(dbInstance, normalizedCode)

  // 코드 존재 확인
  const existing = await getDoc(ref)
  if (!existing.exists()) {
    throw new Error('코드가 존재하지 않습니다.')
  }

  await updateDoc(ref, updates)
}

/**
 * 쿠폰 코드 삭제
 * @param code 코드 문자열
 */
export async function deleteGiftCode(code: string): Promise<void> {
  const dbInstance = getDbInstance()
  // 코드 정규화: 하이픈 제거 및 대문자 변환
  const normalizedCode = code.toUpperCase().replace(/-/g, '')
  const ref = codeDocRef(dbInstance, normalizedCode)

  // 코드 존재 확인
  const existing = await getDoc(ref)
  if (!existing.exists()) {
    throw new Error('코드가 존재하지 않습니다.')
  }

  await deleteDoc(ref)
}

/**
 * 특정 코드 조회
 * @param code 코드 문자열
 * @returns 코드 정보 또는 null
 */
export async function getGiftCode(code: string): Promise<(GiftCode & { createdAt?: number }) | null> {
  const dbInstance = getDbInstance()
  // 코드 정규화: 하이픈 제거 및 대문자 변환
  const normalizedCode = code.toUpperCase().replace(/-/g, '')
  const ref = codeDocRef(dbInstance, normalizedCode)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  return snap.data() as GiftCode & { createdAt?: number }
}

