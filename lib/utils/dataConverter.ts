// 기존 데이터를 명세에 맞는 형식으로 변환하는 유틸
// 현재 데이터 구조를 Word/Kanji 타입으로 변환하는 헬퍼 함수들

import type { Word, Kanji, JlptLevel } from '../types/content'
import type { SearchResult, KanjiAliveEntry } from '@/data/types'
import type { NaverWord } from '@/data/words/index'
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
 * NaverWord를 Word로 변환
 * 네이버 데이터의 partsMeans에서 첫 번째 part의 첫 번째 mean을 사용
 */
export function convertNaverWordToWord(
  naverWord: NaverWord,
  id: string,
  chapter: number = 1
): Word {
  const entry = naverWord.entry
  // 한자 포함 여부 확인
  const hasKanji = /[\u4e00-\u9faf]/.test(entry)
  // 가타카나 포함 여부 확인
  const hasKatakana = /[\u30a0-\u30ff]/.test(entry)
  // 히라가나만 있는지 확인
  const isHiraganaOnly = /^[\u3040-\u309f]+$/.test(entry)
  
  // partsMeans에서 첫 번째 의미 추출
  let meaningKo = ''
  if (naverWord.partsMeans && naverWord.partsMeans.length > 0) {
    const firstPartMean = naverWord.partsMeans[0]
    if (firstPartMean.means && firstPartMean.means.length > 0) {
      // 세미콜론으로 구분된 의미 중 첫 번째 사용
      meaningKo = firstPartMean.means[0].split(';')[0].trim()
    }
  }
  
  const levelMap: Record<string, JlptLevel> = {
    '1': 'N1',
    '2': 'N2',
    '3': 'N3',
    '4': 'N4',
    '5': 'N5',
  }
  
  // entry가 한자를 포함하면 kanji로, 그렇지 않으면 kana로
  return {
    id,
    level: levelMap[naverWord.level] || 'N5',
    chapter,
    kana: entry, // entry 자체를 kana로 사용 (히라가나/가타카나 포함)
    kanji: hasKanji ? entry : undefined, // 한자가 있으면 kanji로도 설정
    meaningKo: meaningKo || entry,
    examples: [],
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

