/**
 * 유저 관리 (Firestore CRUD)
 */
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore'
import type { UserProfile, UserSettings, UserData } from '../../types/user'
import { getDbInstance } from './utils'

/**
 * 유저 문서 생성 (최초 로그인 시)
 */
export async function createUserDocument(
  uid: string,
  initialData?: {
    email?: string
    displayName?: string
    photoURL?: string
    phoneNumber?: string
    birthDate?: string
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

  // undefined 값을 제거하여 Firestore 오류 방지
  const profile: Partial<UserProfile> = {
    createdAt: now,
  }
  
  if (initialData?.displayName !== undefined) {
    profile.displayName = initialData.displayName
  }
  if (initialData?.email !== undefined) {
    profile.email = initialData.email
  }
  if (initialData?.photoURL !== undefined) {
    profile.photoURL = initialData.photoURL
  }
  if (initialData?.phoneNumber !== undefined) {
    profile.phoneNumber = initialData.phoneNumber
  }
  if (initialData?.birthDate !== undefined) {
    profile.birthDate = initialData.birthDate
  }

  const userData: UserData = {
    profile: profile as UserProfile,
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
  // 서버 사이드에서는 Admin SDK 사용
  if (typeof window === 'undefined') {
    // 동적 require로 클라이언트 번들에서 제외
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { adminDb } = require('../admin')
    if (!adminDb) {
      throw new Error('Firestore Admin is not initialized')
    }
    
    const userDoc = await adminDb.collection('users').doc(uid).get()
    
    if (!userDoc.exists) {
      return null
    }
    
    return userDoc.data() as UserData
  }
  
  // 클라이언트 사이드에서는 클라이언트 SDK 사용
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
  
  // undefined 값을 제거하여 Firestore 오류 방지
  const cleanProfile: Partial<UserProfile> = {}
  if (profile.displayName !== undefined) {
    cleanProfile.displayName = profile.displayName
  }
  if (profile.email !== undefined) {
    cleanProfile.email = profile.email
  }
  if (profile.photoURL !== undefined) {
    cleanProfile.photoURL = profile.photoURL
  }
  if (profile.phoneNumber !== undefined) {
    cleanProfile.phoneNumber = profile.phoneNumber
  }
  if (profile.createdAt !== undefined) {
    cleanProfile.createdAt = profile.createdAt
  }
  
  await setDoc(
    userRef,
    {
      profile: cleanProfile,
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

/**
 * 모든 유저 목록 가져오기 (관리자용)
 */
export async function getAllUsers(): Promise<UserProfile[]> {
  const dbInstance = getDbInstance()
  const usersRef = collection(dbInstance, 'users')
  const snapshot = await getDocs(usersRef)

  return snapshot.docs.map(doc => {
    const data = doc.data()
    return {
      uid: doc.id,
      ...data.profile
    } as UserProfile
  })
}

