// 기존 데이터를 명세에 맞는 형식으로 변환하는 유틸
// 현재 데이터 구조를 Word/Kanji 타입으로 변환하는 헬퍼 함수들

import type { Word, Kanji, JlptLevel } from '../types/content'
import type { SearchResult } from '@/data/types'

/**
 * SearchResult를 Word로 변환 (임시 변환 함수)
 * 실제 데이터 구조에 맞게 수정 필요
 */
export function convertSearchResultToWord(
  result: SearchResult,
  id: string,
  chapter: number = 1
): Word {
  return {
    id,
    level: result.level as JlptLevel,
    chapter,
    kana: result.furigana || result.word,
    kanji: result.word !== result.furigana ? result.word : undefined,
    meaningKo: result.meaning,
    examples: [], // 예문 데이터가 있으면 추가
    tags: [],
  }
}

/**
 * WordData를 Kanji로 변환 (임시 변환 함수)
 * 실제 데이터 구조에 맞게 수정 필요
 */
export function convertWordDataToKanji(
  data: any,
  id: string
): Kanji {
  return {
    id,
    level: data.level as JlptLevel,
    character: data.kanji,
    strokeCount: data.strokeCount || 0,
    onyomi: data.onYomi || [],
    kunyomi: data.kunYomi || [],
    meaningKo: data.relatedWords?.[0]?.meaning || '',
    radical: data.radical,
    exampleWordIds: [],
  }
}

