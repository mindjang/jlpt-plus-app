// Firebase Auth 유틸 함수
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
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
export async function signUpWithEmail(email: string, password: string, displayName?: string, phoneNumber?: string) {
  const authInstance = getAuthInstance()
  const userCredential = await createUserWithEmailAndPassword(authInstance, email, password)
  const user = userCredential.user

  // 유저 문서 생성
  await createUserDocument(user.uid, {
    email: user.email || undefined,
    displayName: displayName || user.displayName || undefined,
    photoURL: user.photoURL || undefined,
    phoneNumber: phoneNumber || undefined,
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
 * WebView 감지 함수
 */
function isWebView(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false
  const userAgent = navigator.userAgent
  return /wv|WebView/i.test(userAgent) || 
         /Android.*(wv|\.0\.0\.0)/i.test(userAgent)
}

/**
 * Google로 로그인
 * WebView에서는 signInWithRedirect 사용, 일반 브라우저에서는 signInWithPopup 사용
 */
export async function signInWithGoogle() {
  const authInstance = getAuthInstance()
  const provider = new GoogleAuthProvider()
  
  // WebView 감지
  if (isWebView()) {
    // WebView에서는 redirect 사용 (Google 정책 준수)
    await signInWithRedirect(authInstance, provider)
    // redirect는 페이지 이동이 발생하므로 여기서 반환
    return null
  } else {
    // 일반 브라우저에서는 popup 사용
    const userCredential = await signInWithPopup(authInstance, provider)
    const user = userCredential.user

    // 유저 문서가 없으면 생성
    await createUserDocument(user.uid, {
      email: user.email || undefined,
      displayName: user.displayName || undefined,
      photoURL: user.photoURL || undefined,
    })

    return user
  }
}

/**
 * 리디렉트 결과 처리 (페이지 로드 시 호출)
 * WebView에서 Google 로그인 후 리디렉트된 경우 사용
 */
export async function handleRedirectResult(): Promise<User | null> {
  const authInstance = getAuthInstance()
  try {
    const result = await getRedirectResult(authInstance)
    if (result && result.user) {
      const user = result.user
      
      // 유저 문서가 없으면 생성
      await createUserDocument(user.uid, {
        email: user.email || undefined,
        displayName: user.displayName || undefined,
        photoURL: user.photoURL || undefined,
      })
      
      return user
    }
    return null
  } catch (error) {
    console.error('[Auth] Redirect result error:', error)
    throw error
  }
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

