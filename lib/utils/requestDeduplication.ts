/**
 * 요청 중복 방지 시스템
 * 동일한 요청을 동시에 여러 번 실행하는 것을 방지
 */

/**
 * 진행 중인 요청 추적
 */
const pendingRequests = new Map<string, Promise<any>>()

/**
 * 요청 키 생성 함수 타입
 */
type RequestKeyGenerator<T extends any[]> = (...args: T) => string

/**
 * 기본 키 생성 함수
 */
function defaultKeyGenerator<T extends any[]>(...args: T): string {
  return JSON.stringify(args)
}

/**
 * 중복 방지가 적용된 비동기 함수 래퍼
 * 
 * @example
 * ```typescript
 * const fetchUserData = deduplicateRequest(
 *   async (userId: string) => {
 *     return await getUserData(userId)
 *   },
 *   { ttl: 5000 } // 5초간 캐시
 * )
 * 
 * // 여러 컴포넌트에서 동시에 호출해도 한 번만 실행됨
 * const data1 = await fetchUserData('user123')
 * const data2 = await fetchUserData('user123') // 동일한 요청은 재사용
 * ```
 */
export function deduplicateRequest<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  options: {
    /**
     * 요청 키 생성 함수
     * 기본값: JSON.stringify(args)
     */
    keyGenerator?: RequestKeyGenerator<T>

    /**
     * 요청 결과 캐시 TTL (ms)
     * 같은 시간 내에 동일한 요청이 오면 캐시된 결과 반환
     * @default 0 (캐시 없음, 진행 중인 요청만 공유)
     */
    ttl?: number

    /**
     * 요청 실패 시 캐시에서 제거할지 여부
     * @default true
     */
    removeOnError?: boolean
  } = {}
): (...args: T) => Promise<R> {
  const {
    keyGenerator = defaultKeyGenerator,
    ttl = 0,
    removeOnError = true,
  } = options

  // 결과 캐시 (TTL이 있을 때만 사용)
  const resultCache = new Map<string, { result: R; expiresAt: number }>()

  return async (...args: T): Promise<R> => {
    const key = keyGenerator(...args)

    // 1. 캐시된 결과 확인 (TTL이 있고 아직 유효한 경우)
    if (ttl > 0) {
      const cached = resultCache.get(key)
      if (cached && cached.expiresAt > Date.now()) {
        return cached.result
      }
    }

    // 2. 진행 중인 요청 확인
    const pending = pendingRequests.get(key)
    if (pending) {
      return pending
    }

    // 3. 새 요청 시작
    const requestPromise = (async () => {
      try {
        const result = await fn(...args)

        // 성공 시 캐시에 저장 (TTL이 있는 경우)
        if (ttl > 0) {
          resultCache.set(key, {
            result,
            expiresAt: Date.now() + ttl,
          })
        }

        return result
      } catch (error) {
        // 실패 시 캐시에서 제거
        if (removeOnError) {
          resultCache.delete(key)
        }
        throw error
      } finally {
        // 진행 중인 요청에서 제거
        pendingRequests.delete(key)
      }
    })()

    pendingRequests.set(key, requestPromise)

    return requestPromise
  }
}

/**
 * 캐시 정리 (만료된 항목 제거)
 */
export function cleanupRequestCache(): void {
  // TTL 기반 캐시는 필요시 구현
  // 현재는 pendingRequests만 관리 (자동 정리됨)
}

/**
 * 모든 진행 중인 요청 취소 (AbortController 사용)
 */
export function cancelAllPendingRequests(): void {
  pendingRequests.clear()
}

/**
 * 특정 요청 취소
 */
export function cancelRequest<T extends any[]>(
  keyGenerator: RequestKeyGenerator<T>,
  ...args: T
): void {
  const key = keyGenerator(...args)
  pendingRequests.delete(key)
}
