/**
 * 프로덕션 안전한 로깅 유틸리티
 * 개발 환경에서만 로그를 출력하고, 프로덕션에서는 제거됨
 */

const isDevelopment = process.env.NODE_ENV === 'development'

/**
 * 개발 환경에서만 로그 출력
 */
export const logger = {
  log: (...args: unknown[]) => {
    if (isDevelopment) {
      console.log(...args)
    }
  },
  error: (...args: unknown[]) => {
    // 에러는 항상 출력 (프로덕션에서도 필요)
    console.error(...args)
  },
  warn: (...args: unknown[]) => {
    if (isDevelopment) {
      console.warn(...args)
    }
  },
  info: (...args: unknown[]) => {
    if (isDevelopment) {
      console.info(...args)
    }
  },
  debug: (...args: unknown[]) => {
    if (isDevelopment) {
      console.debug(...args)
    }
  },
}
