/**
 * 멤버십 관리 (Firestore CRUD)
 */
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  updateDoc,
  collection,
  query,
  orderBy,
  getDocs,
  runTransaction,
  type Firestore,
} from 'firebase/firestore'
import type { Membership, DailyUsage, GiftCode, BillingInfo } from '../../types/membership'
import { getDbInstance, formatDateKey } from './utils'

// 헬퍼 함수들
const membershipDocRef = (dbInstance: Firestore, uid: string) =>
  doc(dbInstance, 'users', uid, 'membership', 'info')

const usageDocRef = (dbInstance: Firestore, uid: string, dateKey: string) =>
  doc(dbInstance, 'users', uid, 'usage', dateKey)

const billingDocRef = (dbInstance: Firestore, uid: string) =>
  doc(dbInstance, 'users', uid, 'billing', 'info')

const codeDocRef = (dbInstance: Firestore, code: string) => doc(dbInstance, 'codes', code)

/**
 * 멤버십 정보 가져오기
 */
export async function getMembership(uid: string): Promise<Membership | null> {
  const dbInstance = getDbInstance()
  const ref = membershipDocRef(dbInstance, uid)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  return snap.data() as Membership
}

/**
 * 멤버십 정보 저장
 */
export async function saveMembership(uid: string, membership: Membership) {
  const dbInstance = getDbInstance()
  const ref = membershipDocRef(dbInstance, uid)
  await setDoc(ref, membership, { merge: true })
}

/**
 * 일일 사용량 가져오기
 */
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

/**
 * 일일 세션 증가
 */
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

/**
 * 기프트 코드 사용
 */
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

/**
 * 결제 정보 저장
 * ⚠️ SERVER-ONLY: 이 함수는 서버 API 라우트에서만 호출해야 합니다.
 * Firestore Rules에서 billing 컬렉션은 클라이언트 read/write가 차단되어 있습니다.
 * billingKey와 같은 민감 정보를 보호하기 위한 조치입니다.
 */
export async function saveBillingInfo(uid: string, billing: BillingInfo) {
  const dbInstance = getDbInstance()
  const ref = billingDocRef(dbInstance, uid)
  await setDoc(ref, billing, { merge: true })
}

/**
 * 결제 정보 가져오기
 * ⚠️ SERVER-ONLY: 이 함수는 서버 API 라우트에서만 호출해야 합니다.
 * Firestore Rules에서 billing 컬렉션은 클라이언트 read/write가 차단되어 있습니다.
 */
export async function getBillingInfo(uid: string): Promise<BillingInfo | null> {
  const dbInstance = getDbInstance()
  const ref = billingDocRef(dbInstance, uid)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  return snap.data() as BillingInfo
}

/**
 * 쿠폰 코드 생성
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

