import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Next.js 미들웨어
 * 현재는 특별한 처리가 필요하지 않음
 * 루트 페이지(/)는 클라이언트 사이드에서 인증 상태를 확인하여 리다이렉트 처리
 */
export function middleware(request: NextRequest) {
  // 필요시 여기에 미들웨어 로직 추가
  return NextResponse.next()
}

export const config = {
  matcher: [
    // 현재는 모든 경로를 통과시키고, 루트 페이지에서 클라이언트 사이드 처리
    // 필요시 특정 경로만 필터링 가능
  ],
}

