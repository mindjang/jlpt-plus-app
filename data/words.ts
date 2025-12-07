// 레거시 호환성을 위한 파일
// 새로운 구조는 data/words/index.ts와 data/kanji/index.ts를 사용하세요

import { WordData, SearchResult } from './types'
import { 
  getSearchResults as getWordsSearchResults,
  getTotalWordCount as getWordsTotalCount
} from './words/index'
import { 
  getWordData as getKanjiData,
  searchKanji,
  getTotalKanjiCount as getKanjiTotalCount
} from './kanji/index'

// 단어 검색 (레거시 호환)
export const getSearchResults = (query: string): SearchResult[] => {
  return getWordsSearchResults(query)
}

// 한자 데이터 가져오기 (레거시 호환)
export const getWordData = (word: string): WordData | null => {
  return getKanjiData(word)
}

// 전체 단어 수 가져오기 (레거시 호환)
export const getTotalWordCount = (): number => {
  return getWordsTotalCount()
}

// 한자 검색 결과를 SearchResult 형식으로 변환
const convertKanjiToSearchResult = (kanji: WordData): SearchResult => {
  // 한자의 의미는 relatedWords의 첫 번째 의미를 사용하거나, 
  // onYomi/kunYomi를 조합하여 표시
  const meaning = kanji.relatedWords && kanji.relatedWords.length > 0
    ? kanji.relatedWords[0].meaning
    : kanji.onYomi?.[0] || kanji.kunYomi?.[0] || ''
  
  const furigana = kanji.onYomi?.[0] || kanji.kunYomi?.[0] || undefined

  return {
    level: kanji.level,
    word: kanji.kanji,
    furigana,
    meaning,
  }
}

// 한자 검색 (SearchResult 형식으로 반환)
export const getKanjiSearchResults = (query: string): SearchResult[] => {
  const kanjiResults = searchKanji(query)
  return kanjiResults.map(convertKanjiToSearchResult)
}

// 전체 한자 수 가져오기 (레거시 호환)
export const getTotalKanjiCount = (): number => {
  return getKanjiTotalCount()
}

