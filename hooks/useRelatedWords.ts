/**
 * 관련 단어 로딩 커스텀 훅
 * 한자에 대한 관련 단어를 레벨별로 로드하고 관리
 */
import { useState, useEffect, useMemo } from 'react'
import { getNaverWordsByLevelAsync } from '@/data/words/index'
import type { NaverWord } from '@/data/types'
import type { Level } from '@/data/types'

// 한자별 관련 단어 캐시 (7일 유지)
const RELATED_WORD_CACHE = new Map<
  string,
  { timestamp: number; items: NaverWord[] }
>()
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000 // 7 days

async function getCachedRelatedWords(
  kanjiChar: string,
  level: Level
): Promise<NaverWord[]> {
  const key = `${kanjiChar}:${level}`
  const now = Date.now()
  const cached = RELATED_WORD_CACHE.get(key)
  if (cached && now - cached.timestamp < CACHE_TTL) {
    return cached.items
  }

  // 해당 레벨의 네이버 단어 데이터
  const levelWords: NaverWord[] = await getNaverWordsByLevelAsync(level)
  // kanji 필드에 해당 한자가 포함된 것만 필터링 (상세 데이터 없이 동작)
  const filteredWords = levelWords.filter((w) => w.kanji?.includes(kanjiChar))
  
  RELATED_WORD_CACHE.set(key, { timestamp: now, items: filteredWords })
  return filteredWords
}

interface UseRelatedWordsOptions {
  kanjiCharacter: string | null
  kanjiLevel?: string | null
}

interface UseRelatedWordsResult {
  levelWordsMap: Record<Level, NaverWord[]>
  availableLevels: Set<Level>
  exampleWords: NaverWord[]
  examplePage: number
  setExamplePage: (page: number) => void
  totalPages: number
  currentPageWords: NaverWord[]
}

/**
 * 한자에 대한 관련 단어를 관리하는 커스텀 훅
 */
export function useRelatedWords({
  kanjiCharacter,
  kanjiLevel,
}: UseRelatedWordsOptions): UseRelatedWordsResult {
  const [levelWordsMap, setLevelWordsMap] = useState<Record<Level, NaverWord[]>>({
    N5: [],
    N4: [],
    N3: [],
    N2: [],
    N1: [],
  })
  const [availableLevels, setAvailableLevels] = useState<Set<Level>>(new Set())
  const [examplePage, setExamplePage] = useState(0)

  // 초기 로딩 시 모든 레벨의 관련 단어 조회
  useEffect(() => {
    if (!kanjiCharacter) return

    const load = async () => {
      const allLevels: Level[] = ['N5', 'N4', 'N3', 'N2', 'N1']
      const newLevelWordsMap: Record<Level, NaverWord[]> = {
        N5: [],
        N4: [],
        N3: [],
        N2: [],
        N1: [],
      }
      const newAvailableLevels = new Set<Level>()

      for (const level of allLevels) {
        const words = await getCachedRelatedWords(kanjiCharacter, level)
        newLevelWordsMap[level] = words
        if (words.length > 0) {
          newAvailableLevels.add(level)
        }
      }

      setLevelWordsMap(newLevelWordsMap)
      setAvailableLevels(newAvailableLevels)
    }

    load()
  }, [kanjiCharacter, kanjiLevel])

  // 카드가 변경될 때 페이지 초기화
  useEffect(() => {
    setExamplePage(0)
  }, [kanjiCharacter])

  // N5부터 N1까지 순서대로 각 레벨에서 3개씩 가져오기
  const exampleWords = useMemo(() => {
    if (!kanjiCharacter) return []
    const allLevels: Level[] = ['N5', 'N4', 'N3', 'N2', 'N1']
    const result: NaverWord[] = []
    
    for (const level of allLevels) {
      const words = levelWordsMap[level] || []
      // 각 레벨에서 최대 3개씩 가져오기
      result.push(...words.slice(0, 3))
    }
    
    return result
  }, [kanjiCharacter, levelWordsMap])

  const wordsPerPage = 3
  const totalPages = Math.ceil(exampleWords.length / wordsPerPage)
  const currentPageWords = exampleWords.slice(
    examplePage * wordsPerPage,
    (examplePage + 1) * wordsPerPage
  )

  return {
    levelWordsMap,
    availableLevels,
    exampleWords,
    examplePage,
    setExamplePage,
    totalPages,
    currentPageWords,
  }
}
