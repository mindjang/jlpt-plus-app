import { Level, Word } from '../types'

// 네이버 일본어 사전 데이터
import { n5Words } from './n5'
import { n4Words } from './n4'
import { n3Words } from './n3'
import { n2Words } from './n2'
import { n1Words } from './n1'

export interface NaverWord {
  entry_id: string
  origin_entry_id: string
  entry: string
  level: string
  source: string
  partsMeans: Array<{
    part: string | null
    means: string[]
  }>
  category1: string | null
  category2: string | null
  category3: string | null
}

// 레벨별 네이버 단어 데이터 통합
const allNaverWordsByLevel: Record<Level, Word[]> = {
  N5: n5Words,
  N4: n4Words,
  N3: n3Words,
  N2: n2Words,
  N1: n1Words,
}

// 모든 네이버 단어 통합
const allNaverWords: Word[] = [
  ...n5Words,
  ...n4Words,
  ...n3Words,
  ...n2Words,
  ...n1Words,
]

/**
 * 레벨별 네이버 단어 가져오기
 */
export const getNaverWordsByLevel = (level: Level): Word[] => {
  return allNaverWordsByLevel[level] || []
}

/**
 * 네이버 단어 검색
 * @param query 검색어
 * @param level 필터링할 레벨 (선택사항)
 */
export const getNaverSearchResults = (query: string, level?: Level): Word[] => {
  const targetWords = level ? allNaverWordsByLevel[level] : allNaverWords
  
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
 * 특정 네이버 단어 찾기
 */
export const findNaverWord = (entry: string): Word | null => {
  return allNaverWords.find((item) => item.entry === entry) || null
}

/**
 * 전체 네이버 단어 수 가져오기
 */
export const getTotalNaverWordCount = (): number => {
  return allNaverWords.length
}

// 네이버 단어 export
export { 
  n5Words, 
  n4Words, 
  n3Words, 
  n2Words, 
  n1Words,
}

// 레거시 호환성을 위한 함수들 (기존 코드와의 호환성 유지)
// 이 함수들은 내부적으로 네이버 데이터를 사용합니다
import type { SearchResult } from '../types'

/**
 * 레벨별 단어 가져오기 (레거시 호환)
 * @deprecated getNaverWordsByLevel 사용 권장
 */
export const getWordsByLevel = (level: Level): SearchResult[] => {
  const naverWords = getNaverWordsByLevel(level)
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
 * 검색 결과 가져오기 (레거시 호환)
 * @deprecated getNaverSearchResults 사용 권장
 */
export const getSearchResults = (query: string, level?: Level): SearchResult[] => {
  const naverResults = getNaverSearchResults(query, level)
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
 * 특정 단어 찾기 (레거시 호환)
 * @deprecated findNaverWord 사용 권장
 */
export const findWord = (word: string): SearchResult | null => {
  const naverWord = findNaverWord(word)
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
 * 전체 단어 수 가져오기 (레거시 호환)
 * @deprecated getTotalNaverWordCount 사용 권장
 */
export const getTotalWordCount = (): number => {
  return getTotalNaverWordCount()
}