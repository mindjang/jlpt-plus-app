import type { WordDetails, Level } from '../../types'

// 클라이언트 사이드 캐시
const detailsCache = new Map<string, WordDetails | null>()

/**
 * 단어 상세 정보를 API를 통해 로드합니다
 * @param entry 단어 (히라가나)
 * @param level JLPT 레벨
 * @returns WordDetails 또는 null
 */
export async function getWordDetails(
  entry: string,
  level: Level
): Promise<WordDetails | null> {
  const cacheKey = `${level}:${entry}`
  
  // 클라이언트 캐시 확인
  if (detailsCache.has(cacheKey)) {
    return detailsCache.get(cacheKey) || null
  }

  try {
    // API 라우트를 통해 데이터 로드
    const apiUrl = `/api/words/details?entry=${encodeURIComponent(entry)}&level=${level}`
    const response = await fetch(apiUrl, {
      // HTTP 캐시 헤더 활용 (서버에서 Cache-Control 설정됨)
      cache: 'force-cache', // 브라우저 캐시 활용
    })
    
    if (!response.ok) {
      if (response.status === 404) {
        // 404는 정상적인 경우 (데이터가 없는 경우)
        detailsCache.set(cacheKey, null)
        return null
      }
      console.warn(`[getWordDetails] API error: ${response.status}`)
      detailsCache.set(cacheKey, null)
      return null
    }

    const wordDetails: WordDetails = await response.json()
    
    // 클라이언트 캐시에 저장
    detailsCache.set(cacheKey, wordDetails)
    
    return wordDetails
  } catch (error) {
    console.error(`[getWordDetails] Error loading word details for ${entry}:`, error)
    detailsCache.set(cacheKey, null)
    return null
  }
}

/**
 * 여러 단어의 상세 정보를 한 번에 로드합니다
 * @param entries 단어 배열
 * @param level JLPT 레벨
 * @returns WordDetails 배열 (없는 항목은 null)
 */
export async function getWordDetailsBatch(
  entries: string[],
  level: Level
): Promise<(WordDetails | null)[]> {
  return Promise.all(entries.map((entry) => getWordDetails(entry, level)))
}

