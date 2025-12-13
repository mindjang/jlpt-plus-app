import { KanjiAliveEntry, Level } from '../types'

// Lazy-loaded cache for kanji data
const kanjiCache: Partial<Record<Level, KanjiAliveEntry[]>> = {}

/**
 * 레벨별 한자 가져오기 (동기 - 레거시 호환)
 * @deprecated getKanjiByLevelAsync 사용 권장 (번들 크기 절감)
 */
export const getKanjiByLevel = (level: Level): KanjiAliveEntry[] => {
  // For legacy code that expects sync data, return empty array
  // New code should use async version
  console.warn('getKanjiByLevel is deprecated. Use getKanjiByLevelAsync for better performance.')
  return kanjiCache[level] || []
}

/**
 * 레벨별 한자 가져오기 (비동기 - 지연 로딩)
 * 필요한 레벨 데이터만 동적으로 로드하여 초기 번들 크기를 줄입니다.
 */
export const getKanjiByLevelAsync = async (level: Level): Promise<KanjiAliveEntry[]> => {
  // Check cache first
  if (kanjiCache[level]) {
    return kanjiCache[level]!
  }

  // Dynamic import based on level
  let kanji: KanjiAliveEntry[]
  switch (level) {
    case 'N5':
      const { n5Kanji } = await import('./n5')
      kanji = n5Kanji
      break
    case 'N4':
      const { n4Kanji } = await import('./n4')
      kanji = n4Kanji
      break
    case 'N3':
      const { n3Kanji } = await import('./n3')
      kanji = n3Kanji
      break
    case 'N2':
      const { n2Kanji } = await import('./n2')
      kanji = n2Kanji
      break
    case 'N1':
      const { n1Kanji } = await import('./n1')
      kanji = n1Kanji
      break
    default:
      kanji = []
  }

  // Cache for future use
  kanjiCache[level] = kanji
  return kanji
}

/**
 * 특정 한자 찾기 (비동기)
 */
export const getKanjiEntry = async (kanji: string): Promise<KanjiAliveEntry | null> => {
  const allLevels: Level[] = ['N5', 'N4', 'N3', 'N2', 'N1']
  for (const level of allLevels) {
    const entries = await getKanjiByLevelAsync(level)
    const found = entries.find((item) => {
      const character = item.kanji?.character || item.ka_utf
      return character === kanji
    })
    if (found) return found
  }
  return null
}

/**
 * 한자의 레벨 찾기 (비동기)
 */
export const getKanjiLevel = async (kanji: string): Promise<Level | null> => {
  for (const level of ['N5', 'N4', 'N3', 'N2', 'N1'] as Level[]) {
    const entries = await getKanjiByLevelAsync(level)
    const found = entries.find((item) => {
      const character = item.kanji?.character || item.ka_utf
      return character === kanji
    })
    if (found) return level
  }
  return null
}

/**
 * 한자 검색 (비동기)
 */
export const searchKanji = async (query: string, level?: Level): Promise<KanjiAliveEntry[]> => {
  let targetKanji: KanjiAliveEntry[] = []
  
  if (level) {
    targetKanji = await getKanjiByLevelAsync(level)
  } else {
    // Load all levels
    const allLevels: Level[] = ['N5', 'N4', 'N3', 'N2', 'N1']
    const results = await Promise.all(
      allLevels.map(lvl => getKanjiByLevelAsync(lvl))
    )
    targetKanji = results.flat()
  }
  
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
 * 전체 한자 수 가져오기 (비동기)
 */
export const getTotalKanjiCount = async (): Promise<number> => {
  const allLevels: Level[] = ['N5', 'N4', 'N3', 'N2', 'N1']
  const results = await Promise.all(
    allLevels.map(lvl => getKanjiByLevelAsync(lvl))
  )
  return results.reduce((sum, kanji) => sum + kanji.length, 0)
}
