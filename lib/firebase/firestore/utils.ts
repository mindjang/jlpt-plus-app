/**
 * Firestore 공통 유틸리티 함수
 */
import { db } from '../config'
import type { Firestore } from 'firebase/firestore'

/**
 * Firestore 인스턴스 가져오기
 */
export function getDbInstance(): Firestore {
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

