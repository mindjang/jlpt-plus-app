import { WordData, Level } from '../types'
import { n5Kanji } from './n5'
import { n4Kanji } from './n4'
import { n3Kanji } from './n3'
import { n2Kanji } from './n2'
import { n1Kanji } from './n1'

// 레벨별 한자 데이터 통합
const allKanjiByLevel: Record<Level, WordData[]> = {
  N5: n5Kanji,
  N4: n4Kanji,
  N3: n3Kanji,
  N2: n2Kanji,
  N1: n1Kanji,
}

// 모든 한자 통합 (검색용)
const allKanji: WordData[] = [
  ...n5Kanji,
  ...n4Kanji,
  ...n3Kanji,
  ...n2Kanji,
  ...n1Kanji,
]

/**
 * 레벨별 한자 가져오기
 */
export const getKanjiByLevel = (level: Level): WordData[] => {
  return allKanjiByLevel[level] || []
}

/**
 * 특정 한자 찾기
 */
export const getWordData = (word: string): WordData | null => {
  return allKanji.find((item) => item.kanji === word) || null
}

/**
 * 한자 검색
 */
export const searchKanji = (query: string, level?: Level): WordData[] => {
  const targetKanji = level ? allKanjiByLevel[level] : allKanji
  
  if (!query) {
    return targetKanji
  }

  const lowerQuery = query.toLowerCase()
  return targetKanji.filter(
    (item) =>
      item.kanji.includes(query) ||
      item.onYomi?.some((yomi) => yomi.includes(lowerQuery)) ||
      item.kunYomi?.some((yomi) => yomi.includes(lowerQuery)) ||
      item.radical?.includes(query)
  )
}

/**
 * 전체 한자 수 가져오기
 */
export const getTotalKanjiCount = (): number => {
  return allKanji.length
}

// 레벨별 export
export { n5Kanji, n4Kanji, n3Kanji, n2Kanji, n1Kanji }

