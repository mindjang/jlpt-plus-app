// Firebase Auth 유틸 함수
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  User,
  onAuthStateChanged,
  Auth,
} from 'firebase/auth'
import { auth } from './config'
import { createUserDocument } from './firestore'

function getAuthInstance(): Auth {
  if (!auth) {
    throw new Error('Firebase Auth is not initialized')
  }
  return auth
}

/**
 * 이메일/비밀번호로 회원가입
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  displayName?: string,
  phoneNumber?: string,
  birthDate?: string
) {
  const authInstance = getAuthInstance()
  const userCredential = await createUserWithEmailAndPassword(authInstance, email, password)
  const user = userCredential.user

  // 유저 문서 생성
  await createUserDocument(user.uid, {
    email: user.email || undefined,
    displayName: displayName || user.displayName || undefined,
    photoURL: user.photoURL || undefined,
    phoneNumber: phoneNumber || undefined,
    birthDate: birthDate || undefined,
  })

  return user
}

/**
 * 이메일/비밀번호로 로그인
 */
export async function signInWithEmail(email: string, password: string) {
  const authInstance = getAuthInstance()
  const userCredential = await signInWithEmailAndPassword(authInstance, email, password)
  return userCredential.user
}


/**
 * 로그아웃
 */
export async function signOutUser() {
  const authInstance = getAuthInstance()
  await signOut(authInstance)
}

/**
 * 현재 유저 가져오기
 */
export function getCurrentUser(): User | null {
  if (!auth) return null
  return auth.currentUser
}

/**
 * Auth 상태 변경 감지
 */
export function onAuthChange(callback: (user: User | null) => void) {
  const authInstance = getAuthInstance()
  return onAuthStateChanged(authInstance, callback)
}

