/**
 * 재시도 유틸리티
 * 지수 백오프를 사용한 재시도 메커니즘
 */

export interface RetryOptions {
  /**
   * 최대 재시도 횟수
   * @default 3
   */
  maxRetries?: number

  /**
   * 초기 지연 시간 (ms)
   * @default 1000
   */
  initialDelay?: number

  /**
   * 최대 지연 시간 (ms)
   * @default 10000
   */
  maxDelay?: number

  /**
   * 지수 백오프 배수
   * @default 2
   */
  backoffMultiplier?: number

  /**
   * 재시도할 에러 조건 (함수)
   * true를 반환하면 재시도, false면 즉시 실패
   */
  shouldRetry?: (error: unknown) => boolean

  /**
   * 재시도 전 호출되는 콜백
   */
  onRetry?: (attempt: number, error: unknown) => void
}

/**
 * 지수 백오프 계산
 */
function calculateBackoffDelay(
  attempt: number,
  initialDelay: number,
  maxDelay: number,
  multiplier: number
): number {
  const delay = initialDelay * Math.pow(multiplier, attempt)
  return Math.min(delay, maxDelay)
}

/**
 * 기본 재시도 조건
 * 네트워크 오류, 타임아웃, 일시적 서버 오류 등은 재시도
 */
function defaultShouldRetry(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase()
    const code = (error as any).code?.toLowerCase() || ''

    // 네트워크 오류
    if (message.includes('network') || message.includes('fetch')) {
      return true
    }

    // Firestore 일시적 오류
    if (
      code === 'unavailable' ||
      code === 'deadline-exceeded' ||
      code === 'resource-exhausted' ||
      code === 'aborted'
    ) {
      return true
    }

    // 타임아웃
    if (message.includes('timeout') || code === 'deadline-exceeded') {
      return true
    }
  }

  return false
}

/**
 * 재시도 로직이 포함된 함수 실행
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
    shouldRetry = defaultShouldRetry,
    onRetry,
  } = options

  let lastError: unknown

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error

      // 마지막 시도이거나 재시도하지 않을 에러면 즉시 throw
      if (attempt >= maxRetries || !shouldRetry(error)) {
        throw error
      }

      // 재시도 전 콜백 호출
      if (onRetry) {
        onRetry(attempt + 1, error)
      }

      // 지수 백오프로 대기
      const delay = calculateBackoffDelay(
        attempt,
        initialDelay,
        maxDelay,
        backoffMultiplier
      )

      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  throw lastError
}

/**
 * 배치 작업을 청크로 나누어 처리
 */
export async function processBatch<T, R>(
  items: T[],
  batchSize: number,
  processor: (batch: T[]) => Promise<R[]>,
  options: RetryOptions = {}
): Promise<R[]> {
  const results: R[] = []
  const chunks: T[][] = []

  // 청크로 분할
  for (let i = 0; i < items.length; i += batchSize) {
    chunks.push(items.slice(i, i + batchSize))
  }

  // 각 청크를 재시도 로직과 함께 처리
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]
    const chunkResults = await withRetry(
      () => processor(chunk),
      {
        ...options,
        onRetry: (attempt, error) => {
          options.onRetry?.(attempt, error)
          console.warn(
            `[processBatch] Retrying chunk ${i + 1}/${chunks.length} (attempt ${attempt})`,
            error
          )
        },
      }
    )
    results.push(...chunkResults)
  }

  return results
}
