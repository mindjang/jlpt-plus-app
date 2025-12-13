import { Level, NaverWord } from '../types'

// Lazy-loaded cache for word data
const wordCache: Partial<Record<Level, NaverWord[]>> = {}

/**
 * 레벨별 네이버 단어 가져오기 (동기 - 레거시 호환)
 * @deprecated getNaverWordsByLevelAsync 사용 권장 (번들 크기 절감)
 */
export const getNaverWordsByLevel = (level: Level): NaverWord[] => {
  // For legacy code that expects sync data, return empty array
  // New code should use async version
  console.warn('getNaverWordsByLevel is deprecated. Use getNaverWordsByLevelAsync for better performance.')
  return wordCache[level] || []
}

/**
 * 레벨별 네이버 단어 가져오기 (비동기 - 지연 로딩)
 * 필요한 레벨 데이터만 동적으로 로드하여 초기 번들 크기를 줄입니다.
 */
export const getNaverWordsByLevelAsync = async (level: Level): Promise<NaverWord[]> => {
  // Check cache first
  if (wordCache[level]) {
    return wordCache[level]!
  }

  // Dynamic import based on level
  let words: NaverWord[]
  switch (level) {
    case 'N5':
      const { n5Words } = await import('./n5')
      words = n5Words
      break
    case 'N4':
      const { n4Words } = await import('./n4')
      words = n4Words
      break
    case 'N3':
      const { n3Words } = await import('./n3')
      words = n3Words
      break
    case 'N2':
      const { n2Words } = await import('./n2')
      words = n2Words
      break
    case 'N1':
      const { n1Words } = await import('./n1')
      words = n1Words
      break
    default:
      words = []
  }

  // Cache for future use
  wordCache[level] = words
  return words
}

/**
 * 네이버 단어 검색 (비동기)
 * @param query 검색어
 * @param level 필터링할 레벨 (선택사항)
 */
export const getNaverSearchResults = async (query: string, level?: Level): Promise<NaverWord[]> => {
  let targetWords: NaverWord[] = []
  
  if (level) {
    targetWords = await getNaverWordsByLevelAsync(level)
  } else {
    // Load all levels
    const allLevels: Level[] = ['N5', 'N4', 'N3', 'N2', 'N1']
    const results = await Promise.all(
      allLevels.map(lvl => getNaverWordsByLevelAsync(lvl))
    )
    targetWords = results.flat()
  }
  
  if (!query) {
    return targetWords
  }

  const lowerQuery = query.toLowerCase()
  return targetWords.filter(
    (item) =>
      item.entry.includes(query) ||
      item.entry.toLowerCase().includes(lowerQuery) ||
      item.partsMeans.some((pm: { means: string[] }) => 
        pm.means.some(mean => mean.includes(query) || mean.toLowerCase().includes(lowerQuery))
      )
  )
}

/**
 * 특정 네이버 단어 찾기 (비동기)
 */
export const findNaverWord = async (entry: string): Promise<NaverWord | null> => {
  // Search through all levels
  const allLevels: Level[] = ['N5', 'N4', 'N3', 'N2', 'N1']
  for (const level of allLevels) {
    const words = await getNaverWordsByLevelAsync(level)
    const found = words.find((item) => item.entry === entry)
    if (found) return found
  }
  return null
}

/**
 * 전체 네이버 단어 수 가져오기 (비동기)
 */
export const getTotalNaverWordCount = async (): Promise<number> => {
  const allLevels: Level[] = ['N5', 'N4', 'N3', 'N2', 'N1']
  const results = await Promise.all(
    allLevels.map(lvl => getNaverWordsByLevelAsync(lvl))
  )
  return results.reduce((sum, words) => sum + words.length, 0)
}

// 레거시 호환성을 위한 함수들 (기존 코드와의 호환성 유지)
// 이 함수들은 내부적으로 네이버 데이터를 사용합니다
import type { SearchResult } from '../types'

/**
 * 레벨별 단어 가져오기 (레거시 호환, 비동기)
 * @deprecated getNaverWordsByLevelAsync 사용 권장
 */
export const getWordsByLevel = async (level: Level): Promise<SearchResult[]> => {
  const naverWords = await getNaverWordsByLevelAsync(level)
  return naverWords.map((w) => {
    const firstMean = w.partsMeans && w.partsMeans.length > 0 && w.partsMeans[0].means && w.partsMeans[0].means.length > 0
      ? w.partsMeans[0].means[0]
      : ''
    const levelMap: Record<string, Level> = {
      '1': 'N1',
      '2': 'N2',
      '3': 'N3',
      '4': 'N4',
      '5': 'N5',
    }
    return {
      level: levelMap[w.level] || 'N5',
      word: w.entry,
      furigana: undefined,
      meaning: firstMean,
    }
  })
}

/**
 * 검색 결과 가져오기 (레거시 호환, 비동기)
 * @deprecated getNaverSearchResults 사용 권장
 */
export const getSearchResults = async (query: string, level?: Level): Promise<SearchResult[]> => {
  const naverResults = await getNaverSearchResults(query, level)
  return naverResults.map((w) => {
    const firstMean = w.partsMeans && w.partsMeans.length > 0 && w.partsMeans[0].means && w.partsMeans[0].means.length > 0
      ? w.partsMeans[0].means[0]
      : ''
    const levelMap: Record<string, Level> = {
      '1': 'N1',
      '2': 'N2',
      '3': 'N3',
      '4': 'N4',
      '5': 'N5',
    }
    return {
      level: levelMap[w.level] || 'N5',
      word: w.entry,
      furigana: undefined,
      meaning: firstMean,
    }
  })
}

/**
 * 특정 단어 찾기 (레거시 호환, 비동기)
 * @deprecated findNaverWord 사용 권장
 */
export const findWord = async (word: string): Promise<SearchResult | null> => {
  const naverWord = await findNaverWord(word)
  if (!naverWord) return null
  
  const firstMean = naverWord.partsMeans && naverWord.partsMeans.length > 0 && naverWord.partsMeans[0].means && naverWord.partsMeans[0].means.length > 0
    ? naverWord.partsMeans[0].means[0]
    : ''
  const levelMap: Record<string, Level> = {
    '1': 'N1',
    '2': 'N2',
    '3': 'N3',
    '4': 'N4',
    '5': 'N5',
  }
  return {
    level: levelMap[naverWord.level] || 'N5',
    word: naverWord.entry,
    furigana: undefined,
    meaning: firstMean,
  }
}

/**
 * 전체 단어 수 가져오기 (레거시 호환, 비동기)
 * @deprecated getTotalNaverWordCount 사용 권장
 */
export const getTotalWordCount = async (): Promise<number> => {
  return await getTotalNaverWordCount()
}