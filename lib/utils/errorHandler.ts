/**
 * 에러 처리 유틸리티
 * 일관된 에러 처리 패턴 및 사용자 친화적 메시지 제공
 */

import { logger } from './logger'

export interface AppError extends Error {
  code?: string
  userMessage?: string
}

/**
 * 에러를 AppError로 변환
 */
export function toAppError(error: unknown, defaultMessage: string = '알 수 없는 오류가 발생했습니다'): AppError {
  if (error instanceof Error) {
    return error as AppError
  }

  const appError = new Error(defaultMessage) as AppError
  appError.userMessage = defaultMessage
  return appError
}

/**
 * 사용자 친화적 에러 메시지 생성
 */
export function getUserFriendlyMessage(error: unknown): string {
  const appError = toAppError(error)

  // 사용자 메시지가 있으면 사용
  if (appError.userMessage) {
    return appError.userMessage
  }

  // 에러 코드별 메시지
  switch (appError.code) {
    case 'auth/user-not-found':
      return '사용자를 찾을 수 없습니다'
    case 'auth/wrong-password':
      return '비밀번호가 잘못되었습니다'
    case 'auth/email-already-in-use':
      return '이미 사용 중인 이메일입니다'
    case 'auth/weak-password':
      return '비밀번호가 너무 약합니다'
    case 'permission-denied':
      return '권한이 없습니다'
    case 'unavailable':
      return '서비스를 사용할 수 없습니다. 잠시 후 다시 시도해주세요'
    case 'deadline-exceeded':
      return '요청 시간이 초과되었습니다. 다시 시도해주세요'
    default:
      // 에러 메시지가 있으면 사용, 없으면 기본 메시지
      return appError.message || '오류가 발생했습니다. 잠시 후 다시 시도해주세요'
  }
}

/**
 * 에러를 로깅하고 사용자 친화적 메시지 반환
 */
export function handleError(error: unknown, context?: string): string {
  const appError = toAppError(error)
  const userMessage = getUserFriendlyMessage(error)

  if (context) {
    logger.error(`[${context}]`, appError)
  } else {
    logger.error(appError)
  }

  return userMessage
}

/**
 * Firestore 에러 처리
 */
export function handleFirestoreError(error: unknown, operation: string): string {
  const appError = toAppError(error, `데이터 ${operation} 중 오류가 발생했습니다`)

  // Firestore 특정 에러 코드 처리
  if (appError.message.includes('permission')) {
    appError.code = 'permission-denied'
  } else if (appError.message.includes('unavailable')) {
    appError.code = 'unavailable'
  }

  return handleError(appError, `Firestore:${operation}`)
}

/**
 * 네트워크 에러 처리
 */
export function handleNetworkError(error: unknown): string {
  const appError = toAppError(error, '네트워크 연결을 확인해주세요')
  appError.code = 'network-error'
  return handleError(appError, 'Network')
}
