// 레거시 호환성을 위한 파일
// 새로운 구조는 data/words/index.ts와 data/kanji/index.ts를 사용하세요

import { WordData, SearchResult } from './types'
import { 
  getNaverSearchResults,
  getTotalNaverWordCount,
  findNaverWord,
  getNaverWordsByLevel
} from './words/index'
import type { Word } from './types'
import { 
  getKanjiEntry,
  searchKanji,
  getTotalKanjiCount as getKanjiTotalCount
} from './kanji/index'
import {
  getKanjiCharacter,
  getOnYomi,
  getKunYomi,
  getRadical,
  getStrokeCount,
  getRelatedWords,
  getFirstMeaning,
} from '../lib/utils/kanjiHelpers'
// 단어 검색 (레거시 호환 - 네이버 데이터 사용)
export const getSearchResults = (query: string): SearchResult[] => {
  const naverResults = getNaverSearchResults(query)
  // NaverWord를 SearchResult 형식으로 변환
  return naverResults.map((w: Word) => {
    const firstMean = w.partsMeans && w.partsMeans.length > 0 && w.partsMeans[0].means && w.partsMeans[0].means.length > 0
      ? w.partsMeans[0].means[0]
      : ''
    const levelMap: Record<string, 'N1' | 'N2' | 'N3' | 'N4' | 'N5'> = {
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

// 특정 단어 찾기 (레거시 호환 - 네이버 데이터 사용)
export const findWord = (word: string): SearchResult | null => {
  const naverWord = findNaverWord(word)
  if (!naverWord) return null
  
  const firstMean = naverWord.partsMeans && naverWord.partsMeans.length > 0 && naverWord.partsMeans[0].means && naverWord.partsMeans[0].means.length > 0
    ? naverWord.partsMeans[0].means[0]
    : ''
  const levelMap: Record<string, 'N1' | 'N2' | 'N3' | 'N4' | 'N5'> = {
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

// 한자 데이터 가져오기 (레거시 호환)
// KanjiAliveEntry를 WordData로 변환하여 반환
export const getWordData = (word: string): WordData | null => {
  const entry = getKanjiEntry(word)
  if (!entry) return null

  // 레벨 추정 (N5부터 확인)
  const level = 'N5' // TODO: entry에서 레벨 정보 추출 필요

  return {
    level: level as any,
    kanji: getKanjiCharacter(entry),
    onYomi: getOnYomi(entry),
    kunYomi: getKunYomi(entry),
    radical: getRadical(entry),
    strokeCount: getStrokeCount(entry),
    relatedWords: getRelatedWords(entry, level),
    meaning: [getFirstMeaning(entry)].filter(Boolean),
  }
}

// 전체 단어 수 가져오기 (레거시 호환 - 네이버 데이터 사용)
export const getTotalWordCount = (): number => {
  return getTotalNaverWordCount()
}

// 한자 검색 결과를 SearchResult 형식으로 변환
const convertKanjiToSearchResult = (entry: any, level: string): SearchResult => {
  const character = getKanjiCharacter(entry)
  const onYomi = getOnYomi(entry)
  const kunYomi = getKunYomi(entry)
  const meaning = getFirstMeaning(entry)
  const furigana = onYomi[0] || kunYomi[0] || undefined

  return {
    level: level as any,
    word: character,
    furigana,
    meaning,
  }
}

// 한자 검색 (SearchResult 형식으로 반환)
export const getKanjiSearchResults = (query: string): SearchResult[] => {
  const kanjiResults = searchKanji(query)
  // 레벨 추정 (N5부터 확인)
  const level = 'N5' // TODO: entry에서 레벨 정보 추출 필요
  return kanjiResults.map((entry) => convertKanjiToSearchResult(entry, level))
}

// 전체 한자 수 가져오기 (레거시 호환)
export const getTotalKanjiCount = (): number => {
  return getKanjiTotalCount()
}

