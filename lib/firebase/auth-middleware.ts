/**
 * API 라우트 인증 미들웨어
 */
import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, isAdminConfigured } from './admin'

export interface AuthenticatedRequest extends NextRequest {
  uid?: string
  user?: {
    uid: string
    email?: string
    email_verified?: boolean
  }
}

/**
 * Authorization 헤더에서 Firebase ID 토큰을 검증
 * @param request Next.js Request 객체
 * @returns 인증된 사용자 정보 또는 null
 */
export async function verifyAuth(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  if (!isAdminConfigured || !adminAuth) {
    console.error('Token verification failed: Firebase Admin is not configured.')
    return null
  }

  const token = authHeader.split('Bearer ')[1]
  
  try {
    const decodedToken = await adminAuth.verifyIdToken(token)
    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
      email_verified: decodedToken.email_verified,
    }
  } catch (error) {
    console.error('Token verification failed:', error)
    return null
  }
}

/**
 * API 라우트에서 인증 필요 시 사용하는 헬퍼 함수
 * @param request Next.js Request 객체
 * @returns [user, errorResponse] - user가 null이면 errorResponse 반환
 */
export async function requireAuth(request: NextRequest): Promise<
  [
    user: { uid: string; email?: string; email_verified?: boolean } | null,
    errorResponse: NextResponse | null
  ]
> {
  const user = await verifyAuth(request)
  
  if (!user) {
    return [
      null,
      NextResponse.json(
        { error: 'Unauthorized', message: '로그인이 필요합니다.' },
        { status: 401 }
      ),
    ]
  }
  
  return [user, null]
}
