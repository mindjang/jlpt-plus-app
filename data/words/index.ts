import { SearchResult, Level } from '../types'
import { n5Words } from './n5'
import { n4Words } from './n4'
import { n3Words } from './n3'
import { n2Words } from './n2'
import { n1Words } from './n1'

// 레벨별 단어 데이터 통합
const allWordsByLevel: Record<Level, SearchResult[]> = {
  N5: n5Words,
  N4: n4Words,
  N3: n3Words,
  N2: n2Words,
  N1: n1Words,
}

// 모든 단어 통합 (검색용)
const allWords: SearchResult[] = [
  ...n5Words,
  ...n4Words,
  ...n3Words,
  ...n2Words,
  ...n1Words,
]

/**
 * 레벨별 단어 가져오기
 */
export const getWordsByLevel = (level: Level): SearchResult[] => {
  return allWordsByLevel[level] || []
}

/**
 * 검색 결과 가져오기
 * @param query 검색어
 * @param level 필터링할 레벨 (선택사항)
 */
export const getSearchResults = (query: string, level?: Level): SearchResult[] => {
  const targetWords = level ? allWordsByLevel[level] : allWords
  
  if (!query) {
    return targetWords
  }

  const lowerQuery = query.toLowerCase()
  return targetWords.filter(
    (item) =>
      item.word.includes(query) ||
      item.furigana?.toLowerCase().includes(lowerQuery) ||
      item.meaning.includes(query)
  )
}

/**
 * 특정 단어 찾기
 */
export const findWord = (word: string): SearchResult | null => {
  return allWords.find((item) => item.word === word) || null
}

/**
 * 전체 단어 수 가져오기
 */
export const getTotalWordCount = (): number => {
  return allWords.length
}

// 레벨별 export
export { n5Words, n4Words, n3Words, n2Words, n1Words }

