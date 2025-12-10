// 기존 데이터를 명세에 맞는 형식으로 변환하는 유틸
// 현재 데이터 구조를 Word/Kanji 타입으로 변환하는 헬퍼 함수들

import type { Word, Kanji, JlptLevel } from '../types/content'
import type { SearchResult, KanjiAliveEntry } from '@/data/types'
import {
  getKanjiCharacter,
  getOnYomi,
  getKunYomi,
  getRadical,
  getStrokeCount,
  getFirstMeaning,
} from './kanjiHelpers'

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
 * KanjiAliveEntry를 Kanji로 변환
 */
export function convertKanjiAliveEntryToKanji(
  entry: KanjiAliveEntry,
  id: string,
  level: JlptLevel
): Kanji {
  return {
    id,
    level,
    character: getKanjiCharacter(entry),
    strokeCount: getStrokeCount(entry) || 0,
    onyomi: getOnYomi(entry),
    kunyomi: getKunYomi(entry),
    meaningKo: getFirstMeaning(entry),
    radical: getRadical(entry) || undefined,
    exampleWordIds: [],
  }
}

/**
 * WordData를 Kanji로 변환 (레거시 호환)
 * @deprecated convertKanjiAliveEntryToKanji 사용 권장
 */
export function convertWordDataToKanji(
  data: any,
  id: string
): Kanji {
  // 의미는 relatedWords의 첫 번째 의미를 사용하거나, meaning 배열의 첫 번째를 사용
  const meaningKo = data.relatedWords?.[0]?.meaning 
    || data.meaning?.[0] 
    || data.kanji 
    || ''

  return {
    id,
    level: data.level as JlptLevel,
    character: data.kanji,
    strokeCount: data.strokeCount || 0,
    onyomi: data.onYomi || [],
    kunyomi: data.kunYomi || [],
    meaningKo,
    radical: data.radical || undefined,
    exampleWordIds: [],
  }
}

