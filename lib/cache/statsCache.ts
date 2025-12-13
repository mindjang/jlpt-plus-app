/**
 * 통계 데이터 클라이언트 캐싱
 * 메모리 + localStorage 이중 캐싱 전략
 */

// 메모리 캐시 (세션 동안 유지)
const memoryCache = new Map<string, any>()

// 기본 TTL: 24시간
const DEFAULT_TTL = 24 * 60 * 60 * 1000

/**
 * 캐시된 통계 데이터 가져오기
 */
export function getCachedStats(key: string, ttl: number = DEFAULT_TTL): any | null {
  // 1. 메모리 캐시 확인
  if (memoryCache.has(key)) {
    return memoryCache.get(key)
  }

  // 2. localStorage 확인
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(`stats_${key}`)
      if (stored) {
        const { data, timestamp } = JSON.parse(stored)
        if (Date.now() - timestamp < ttl) {
          // 메모리 캐시에도 저장
          memoryCache.set(key, data)
          return data
        } else {
          // 만료된 데이터 삭제
          localStorage.removeItem(`stats_${key}`)
        }
      }
    } catch (error) {
      console.error('[getCachedStats] Error:', error)
    }
  }

  return null
}

/**
 * 통계 데이터 캐싱
 */
export function setCachedStats(key: string, data: any): void {
  // 메모리 캐시에 저장
  memoryCache.set(key, data)

  // localStorage에 저장
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(
        `stats_${key}`,
        JSON.stringify({
          data,
          timestamp: Date.now(),
        })
      )
    } catch (error) {
      console.error('[setCachedStats] Error:', error)
      // localStorage 용량 초과 시 오래된 캐시 삭제
      clearOldCaches()
    }
  }
}

/**
 * 특정 캐시 삭제
 */
export function removeCachedStats(key: string): void {
  memoryCache.delete(key)

  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(`stats_${key}`)
    } catch (error) {
      console.error('[removeCachedStats] Error:', error)
    }
  }
}

/**
 * 모든 통계 캐시 삭제
 */
export function clearAllStatsCache(): void {
  memoryCache.clear()

  if (typeof window !== 'undefined') {
    try {
      const keys = Object.keys(localStorage)
      keys.forEach((key) => {
        if (key.startsWith('stats_')) {
          localStorage.removeItem(key)
        }
      })
    } catch (error) {
      console.error('[clearAllStatsCache] Error:', error)
    }
  }
}

/**
 * 오래된 캐시 삭제 (용량 관리)
 */
function clearOldCaches(): void {
  if (typeof window === 'undefined') return

  try {
    const keys = Object.keys(localStorage)
    const statsCaches: Array<{ key: string; timestamp: number }> = []

    keys.forEach((key) => {
      if (key.startsWith('stats_')) {
        try {
          const stored = localStorage.getItem(key)
          if (stored) {
            const { timestamp } = JSON.parse(stored)
            statsCaches.push({ key, timestamp })
          }
        } catch (e) {
          // 파싱 실패 시 삭제
          localStorage.removeItem(key)
        }
      }
    })

    // 타임스탬프 오래된 순으로 정렬
    statsCaches.sort((a, b) => a.timestamp - b.timestamp)

    // 오래된 캐시 50% 삭제
    const toDelete = statsCaches.slice(0, Math.floor(statsCaches.length * 0.5))
    toDelete.forEach(({ key }) => localStorage.removeItem(key))
  } catch (error) {
    console.error('[clearOldCaches] Error:', error)
  }
}

/**
 * 오늘 데이터 캐시 키 생성
 */
export function getTodayKey(uid: string): string {
  const today = new Date().toISOString().split('T')[0]
  return `${uid}_daily_${today}`
}

/**
 * 연속 일수 캐시 키 생성
 */
export function getStreakKey(uid: string): string {
  return `${uid}_streak`
}

/**
 * 히트맵 데이터 캐시 키 생성
 */
export function getHeatmapKey(uid: string, year: number): string {
  return `${uid}_heatmap_${year}`
}

/**
 * 주간 데이터 캐시 키 생성
 */
export function getWeekKey(uid: string, weekStart: string): string {
  return `${uid}_week_${weekStart}`
}

