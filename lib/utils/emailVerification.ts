/**
 * 이메일 인증번호 발송 및 검증 유틸리티
 */
import { logger } from './logger'

/**
 * 이메일 인증번호 발송 (서버 API를 통해 이메일 발송)
 */
export async function sendVerificationCode(email: string): Promise<void> {
  try {
    const response = await fetch('/api/auth/send-verification-code', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || '인증번호 발송에 실패했습니다.')
    }

    // 개발 모드에서 코드를 콘솔에 출력
    if (process.env.NODE_ENV === 'development' && data.code) {
      console.log(`[개발 모드] 이메일 인증번호: ${data.code}`)
      logger.info('[EmailVerification] Code sent (dev mode)', { email, code: data.code })
    } else {
      logger.info('[EmailVerification] Code sent', { email })
    }
  } catch (error) {
    logger.error('[EmailVerification] Failed to send verification code', error)
    throw error
  }
}

/**
 * 인증번호 검증 (서버 API를 통해 검증)
 */
export async function verifyCode(email: string, inputCode: string): Promise<boolean> {
  try {
    const response = await fetch('/api/auth/verify-code', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, code: inputCode }),
    })

    const data = await response.json()

    if (!response.ok) {
      logger.warn('[EmailVerification] Code verification failed', {
        email,
        error: data.error,
      })
      return false
    }

    logger.info('[EmailVerification] Code verified successfully', { email })
    return true
  } catch (error) {
    logger.error('[EmailVerification] Failed to verify code', error)
    return false
  }
}

/**
 * 인증번호 만료 확인 (클라이언트에서는 정확한 만료 시간을 알 수 없으므로 항상 false 반환)
 * 실제 만료 확인은 서버에서 처리됩니다.
 */
export function isCodeExpired(email: string): boolean {
  // 클라이언트에서는 정확한 만료 시간을 알 수 없으므로 항상 false 반환
  // 실제 만료 확인은 서버 API에서 처리됩니다.
  return false
}

