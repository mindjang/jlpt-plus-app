/**
 * 에러 타입 정의
 */

export interface AppError extends Error {
  code?: string
  userMessage?: string
}

