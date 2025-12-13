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
      phoneNumber: initialData?.phoneNumber,
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

