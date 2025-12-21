/**
 * Firestore 공통 유틸리티 함수
 */
import { db } from '../config'
import type { Firestore } from 'firebase/firestore'

/**
 * Firestore 인스턴스 가져오기
 * 서버 사이드에서는 Admin SDK를, 클라이언트 사이드에서는 클라이언트 SDK를 사용
 */
export function getDbInstance(): Firestore | any {
  // 서버 사이드 (Node.js 환경)
  if (typeof window === 'undefined') {
    // 동적 require로 클라이언트 번들에서 제외
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { adminDb } = require('../admin')
    if (!adminDb) {
      throw new Error('Firestore Admin is not initialized. Check FIREBASE_SERVICE_ACCOUNT or FIREBASE_PROJECT_ID environment variables.')
    }
    return adminDb
  }
  
  // 클라이언트 사이드
  if (!db) {
    throw new Error('Firestore is not initialized')
  }
  return db
}

/**
 * 날짜 키 포맷팅 (YYYY-MM-DD)
 */
export function formatDateKey(date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

