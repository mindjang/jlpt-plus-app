/**
 * 관련 단어 로딩 커스텀 훅
 * 한자에 대한 관련 단어를 레벨별로 로드하고 관리
 */
import { useState, useEffect, useMemo } from 'react'
import { getNaverWordsByLevel } from '@/data/words/index'
import { convertNaverWordToWord } from '@/lib/utils/dataConverter'
import type { Word } from '@/lib/types/content'
import type { Level } from '@/data/types'
import type { NaverWord } from '@/data/words/index'

// 한자별 관련 단어 캐시 (7일 유지)
const RELATED_WORD_CACHE = new Map<
  string,
  { timestamp: number; items: Word[] }
>()
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000 // 7 days

function getCachedRelatedWords(
  kanjiChar: string,
  level: Level
): Word[] {
  const key = `${kanjiChar}:${level}`
  const now = Date.now()
  const cached = RELATED_WORD_CACHE.get(key)
  if (cached && now - cached.timestamp < CACHE_TTL) {
    return cached.items
  }

  // 해당 레벨의 네이버 단어 데이터에서 한자가 포함된 단어 필터링
  const levelWords: NaverWord[] = getNaverWordsByLevel(level)
  const filteredWords = levelWords.filter(
    (w) => w.entry.includes(kanjiChar)
  )
  
  // NaverWord를 Word 타입으로 변환
  const items: Word[] = filteredWords.map((naverWord, index) =>
    convertNaverWordToWord(naverWord, `${level}_W_${String(index + 1).padStart(4, '0')}`, 1)
  )
  
  RELATED_WORD_CACHE.set(key, { timestamp: now, items })
  return items
}

interface UseRelatedWordsOptions {
  kanjiCharacter: string | null
  kanjiLevel?: string | null
}

interface UseRelatedWordsResult {
  levelWordsMap: Record<Level, Word[]>
  availableLevels: Set<Level>
  activeLevel: Level
  setActiveLevel: (level: Level) => void
  exampleWords: Word[]
  examplePage: number
  setExamplePage: (page: number) => void
  totalPages: number
  currentPageWords: Word[]
}

/**
 * 한자에 대한 관련 단어를 관리하는 커스텀 훅
 */
export function useRelatedWords({
  kanjiCharacter,
  kanjiLevel,
}: UseRelatedWordsOptions): UseRelatedWordsResult {
  const [levelWordsMap, setLevelWordsMap] = useState<Record<Level, Word[]>>({
    N5: [],
    N4: [],
    N3: [],
    N2: [],
    N1: [],
  })
  const [availableLevels, setAvailableLevels] = useState<Set<Level>>(new Set())
  const [activeLevel, setActiveLevel] = useState<Level>('N5')
  const [examplePage, setExamplePage] = useState(0)

  // 초기 로딩 시 모든 레벨의 관련 단어 조회
  useEffect(() => {
    if (!kanjiCharacter) return

    const allLevels: Level[] = ['N5', 'N4', 'N3', 'N2', 'N1']
    const newLevelWordsMap: Record<Level, Word[]> = {
      N5: [],
      N4: [],
      N3: [],
      N2: [],
      N1: [],
    }
    const newAvailableLevels = new Set<Level>()

    // 모든 레벨에 대해 관련 단어 조회
    allLevels.forEach((level) => {
      const words = getCachedRelatedWords(kanjiCharacter, level)
      newLevelWordsMap[level] = words
      if (words.length > 0) {
        newAvailableLevels.add(level)
      }
    })

    setLevelWordsMap(newLevelWordsMap)
    setAvailableLevels(newAvailableLevels)

    // 첫 번째 사용 가능한 레벨로 초기화 (또는 한자의 레벨)
    if (kanjiLevel && newAvailableLevels.has(kanjiLevel as Level)) {
      setActiveLevel(kanjiLevel as Level)
    } else if (newAvailableLevels.size > 0) {
      // 사용 가능한 첫 번째 레벨 선택
      const firstAvailable = Array.from(newAvailableLevels)[0]
      setActiveLevel(firstAvailable)
    }
  }, [kanjiCharacter, kanjiLevel])

  // 카드가 변경될 때 페이지 초기화
  useEffect(() => {
    setExamplePage(0)
  }, [kanjiCharacter])

  // 현재 선택된 레벨의 단어 가져오기 (미리 조회한 데이터 사용)
  const exampleWords = useMemo(() => {
    if (!kanjiCharacter) return []
    const words = levelWordsMap[activeLevel] || []
    return words.slice(0, 9) // 최대 9개 (3개씩 3페이지)
  }, [kanjiCharacter, activeLevel, levelWordsMap])

  const wordsPerPage = 3
  const totalPages = Math.ceil(exampleWords.length / wordsPerPage)
  const currentPageWords = exampleWords.slice(
    examplePage * wordsPerPage,
    (examplePage + 1) * wordsPerPage
  )

  return {
    levelWordsMap,
    availableLevels,
    activeLevel,
    setActiveLevel,
    exampleWords,
    examplePage,
    setExamplePage,
    totalPages,
    currentPageWords,
  }
}
