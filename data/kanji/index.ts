import { KanjiAliveEntry, Level } from '../types'
import { n5Kanji } from './n5'
import { n4Kanji } from './n4'
import { n3Kanji } from './n3'
import { n2Kanji } from './n2'
import { n1Kanji } from './n1'

// 레벨별 한자 데이터 통합
// N1은 WordData 형식이므로 나중에 변환 필요 (현재는 빈 배열)
const allKanjiByLevel: Record<Level, KanjiAliveEntry[]> = {
  N5: n5Kanji,
  N4: n4Kanji,
  N3: n3Kanji,
  N2: n2Kanji,
  N1: [], // TODO: n1Kanji를 KanjiAliveEntry로 변환 필요
}

// 모든 한자 통합 (검색용)
const allKanji: KanjiAliveEntry[] = [
  ...n5Kanji,
  ...n4Kanji,
  ...n3Kanji,
  ...n2Kanji,
  // ...n1Kanji, // TODO: 변환 후 추가
]

/**
 * 레벨별 한자 가져오기
 */
export const getKanjiByLevel = (level: Level): KanjiAliveEntry[] => {
  return allKanjiByLevel[level] || []
}

/**
 * 특정 한자 찾기
 */
export const getKanjiEntry = (kanji: string): KanjiAliveEntry | null => {
  return allKanji.find((item) => {
    const character = item.kanji?.character || item.ka_utf
    return character === kanji
  }) || null
}

/**
 * 한자의 레벨 찾기
 */
export const getKanjiLevel = (kanji: string): Level | null => {
  for (const level of ['N5', 'N4', 'N3', 'N2', 'N1'] as Level[]) {
    const entries = allKanjiByLevel[level]
    const found = entries.find((item) => {
      const character = item.kanji?.character || item.ka_utf
      return character === kanji
    })
    if (found) return level
  }
  return null
}

/**
 * 한자 검색
 */
export const searchKanji = (query: string, level?: Level): KanjiAliveEntry[] => {
  const targetKanji = level ? allKanjiByLevel[level] : allKanji
  
  if (!query) {
    return targetKanji
  }

  const lowerQuery = query.toLowerCase()
  return targetKanji.filter((item) => {
    const character = item.kanji?.character || item.ka_utf
    // 검색은 가타카나/히라가나 우선, 로마자는 보조
    const onyomi =
      item.kanji?.onyomi?.katakana ||
      item.onyomi_ja ||
      ''
    const kunyomi =
      item.kanji?.kunyomi?.hiragana ||
      item.kunyomi_ja ||
      ''
    const radical = item.radical?.character || item.rad_utf || ''
    
    return (
      character.includes(query) ||
      onyomi.toLowerCase().includes(lowerQuery) ||
      kunyomi.toLowerCase().includes(lowerQuery) ||
      radical.includes(query)
    )
  })
}

/**
 * 전체 한자 수 가져오기
 */
export const getTotalKanjiCount = (): number => {
  return allKanji.length
}

// 레벨별 export
export { n5Kanji, n4Kanji, n3Kanji, n2Kanji, n1Kanji }
