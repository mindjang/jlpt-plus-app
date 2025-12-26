/**
 * Next.js Instrumentation
 * 서버 사이드 전역 에러 핸들러 및 프로세스 모니터링
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // 처리되지 않은 Promise 거부 핸들러
    process.on('unhandledRejection', (reason: unknown, promise: Promise<any>) => {
      console.error('[Instrumentation] Unhandled Rejection at:', promise, 'reason:', reason)
      
      // 에러 객체인 경우 스택 트레이스 출력
      if (reason instanceof Error) {
        console.error('[Instrumentation] Error stack:', reason.stack)
      }
      
      // 프로세스 종료 방지 - 로깅만 하고 계속 실행
      // 프로덕션에서는 에러 모니터링 서비스로 전송 가능
    })

    // 처리되지 않은 예외 핸들러
    process.on('uncaughtException', (error: Error) => {
      console.error('[Instrumentation] Uncaught Exception:', error)
      console.error('[Instrumentation] Error stack:', error.stack)
      
      // 치명적인 에러가 아닌 경우 프로세스 종료 방지
      // 치명적인 에러의 경우에만 프로세스 종료
      if (error.name === 'FatalError' || error.message.includes('FATAL')) {
        console.error('[Instrumentation] Fatal error detected, exiting...')
        process.exit(1)
      }
      
      // 그 외의 경우 로깅만 하고 계속 실행
    })

    // 경고 이벤트 핸들러 (punycode 경고 등)
    process.on('warning', (warning: Error) => {
      // punycode 경고는 무시 (의존성 패키지 문제)
      if (warning.name === 'DeprecationWarning' && warning.message.includes('punycode')) {
        // 경고만 로깅하고 무시
        return
      }
      
      console.warn('[Instrumentation] Warning:', warning.name, warning.message)
    })

    console.info('[Instrumentation] Global error handlers registered')
  }
}

